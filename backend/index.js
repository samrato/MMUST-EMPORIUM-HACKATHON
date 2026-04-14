require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios'); // Added axios for easy REST calls

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const API_KEY = process.env.VERTEX_API_KEY;
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT;
const LOCATION = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
const MODEL_ID = 'gemini-2.5-flash-lite';

// Helper to call Vertex AI REST API
async function callVertexAi(prompt) {
    const url = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL_ID}:streamGenerateContent?key=${API_KEY}`;
    
    const data = {
        contents: [
            {
                role: 'user',
                parts: [{ text: prompt }]
            }
        ],
        generationConfig: {
            maxOutputTokens: 2048,
            temperature: 0.7,
            topP: 0.8,
            topK: 40
        }
    };

    try {
        const response = await axios.post(url, data);
        // streamGenerateContent returns an array of chunks
        const fullText = response.data
            .map(chunk => chunk.candidates[0].content.parts[0].text)
            .join('');
        return fullText;
    } catch (error) {
        console.error('Vertex AI REST Error:', error.response?.data || error.message);
        throw error;
    }
}

app.post('/api/triage', async (req, res) => {
    const { symptoms, language = 'en' } = req.body;
    if (!symptoms) return res.status(400).json({ error: 'Symptoms required' });

    const prompt = `Analyze these symptoms for a patient in Kenya and return ONLY a JSON object with: condition, urgency (low/medium/high/emergency), description, recommendations (list), and warnings. Language: ${language}. Input: "${symptoms}"`;

    try {
        const text = await callVertexAi(prompt);
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        res.json(jsonMatch ? JSON.parse(jsonMatch[0]) : { error: 'Failed to parse', raw: text });
    } catch (error) {
        res.status(500).json({ error: 'Vertex AI Triage failed', details: error.message });
    }
});

app.post('/api/practitioner', async (req, res) => {
    const { clinicalCase } = req.body;
    if (!clinicalCase) return res.status(400).json({ error: 'Clinical case required' });

    const prompt = `You are a medical consultant. Analyze this case and return ONLY a JSON object with: differential_diagnosis, suggested_tests, clinical_summary, red_flags, and management_considerations. Case: "${clinicalCase}"`;

    try {
        const text = await callVertexAi(prompt);
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        res.json(jsonMatch ? JSON.parse(jsonMatch[0]) : { error: 'Failed to parse', raw: text });
    } catch (error) {
        res.status(500).json({ error: 'Vertex AI Practitioner failed', details: error.message });
    }
});

app.listen(port, () => {
    console.log(`Vertex AI (REST) Backend running at http://localhost:${port}`);
});
