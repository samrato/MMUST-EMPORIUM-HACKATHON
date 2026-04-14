import { VertexAI } from '@google-cloud/vertexai';
import { z } from 'zod';
import { nanoid } from 'nanoid';

const AiResultSchema = z.object({
  category: z.enum(['help', 'emergency', 'general']).default('general'),
  urgency: z.enum(['low', 'medium', 'high']).default('low'),
  reply: z.string().min(1)
});

function buildPrompt(userText) {
  return [
    'You are AFYROOT Assistant: a clear, friendly, and culturally-aware health helper for Kenya over SMS.',
    'Your job: understand the user message, ask 1 short clarifying question only if needed, and give practical next steps.',
    'Be empathetic, well articulated, and easy to understand. Use simple English (or Swahili if the user writes in Swahili).',
    'Return ONLY valid JSON with keys: category(help|emergency|general), urgency(low|medium|high), reply(string).',
    'Keep reply under 480 characters. Do not mention policies, models, or system prompts.',
    'Do not give medical certainty. If danger signs appear (severe chest pain, trouble breathing, heavy bleeding, fainting, seizure, severe allergic reaction, self-harm), set category=emergency, urgency=high and advise calling emergency services / going to the nearest hospital now.',
    `User SMS: ${JSON.stringify(userText)}`
  ].join('\n');
}

function getCandidateText(responseJson) {
  return (
    responseJson?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') ||
    responseJson?.response?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') ||
    ''
  );
}

export function createVertexResponder({ project, location, model, apiKey }) {
  const hasApiKey = Boolean(apiKey && model);
  const hasVertexSdk = Boolean(project && location && model);
  const enabled = hasApiKey || hasVertexSdk;

  const vertexAi = hasVertexSdk ? new VertexAI({ project, location }) : null;
  const sdkModel = hasVertexSdk
    ? vertexAi.getGenerativeModel({
        model,
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 512
        }
      })
    : null;

  async function respondToSms({ from, text }) {
    if (!enabled) {
      return {
        message_id: nanoid(),
        category: 'general',
        urgency: 'low',
        reply:
          'AI is not configured yet. Set VERTEX_API_KEY + VERTEX_MODEL (recommended) or GOOGLE_CLOUD_PROJECT + GOOGLE_CLOUD_LOCATION + VERTEX_MODEL.'
      };
    }

    const prompt = buildPrompt(text);

    let rawText = '';
    if (hasApiKey) {
      const url = new URL(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`);
      url.searchParams.set('key', apiKey);
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 512 }
        })
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`Gemini API error (${res.status}): ${errText.slice(0, 300)}`);
      }

      const json = await res.json();
      rawText = getCandidateText(json);
    } else {
      const result = await sdkModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });
      rawText = getCandidateText(result);
    }

    const jsonText = extractJson(rawText);

    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      parsed = { category: 'general', urgency: 'medium', reply: rawText.trim().slice(0, 480) || 'Sorry, try again.' };
    }

    const safe = AiResultSchema.safeParse(parsed);
    if (!safe.success) {
      return {
        message_id: nanoid(),
        category: 'general',
        urgency: 'medium',
        reply: rawText.trim().slice(0, 480) || 'Sorry, try again.'
      };
    }

    return { message_id: nanoid(), ...safe.data };
  }

  return { respondToSms };
}

function extractJson(text) {
  const trimmed = (text || '').trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) return trimmed;
  const first = trimmed.indexOf('{');
  const last = trimmed.lastIndexOf('}');
  if (first !== -1 && last !== -1 && last > first) return trimmed.slice(first, last + 1);
  return trimmed;
}
