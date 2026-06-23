require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

// Initialize database seed
require('./src/models/dataStore');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Serve static client assets (e.g. Admin Portal)
app.use(express.static(path.join(__dirname, 'public')));

// Static documentation file access (if needed)
app.use('/docs', express.static(path.join(__dirname, 'KMHFR_INTEGRATION_DOCS.md')));

// Mount API Routes
const triageRouter = require('./src/routes/triage');
const facilityRouter = require('./src/routes/facility');
const routingRouter = require('./src/routes/routing');
const liveStatusRouter = require('./src/routes/liveStatus');
const bookingRouter = require('./src/routes/booking');
const intelligenceRouter = require('./src/routes/intelligence');

app.use('/api/triage', triageRouter);
app.use('/api/facilities', facilityRouter);
app.use('/api/route', routingRouter);
app.use('/api/live-status', liveStatusRouter);
app.use('/api/bookings', bookingRouter);
app.use('/api/intelligence', intelligenceRouter);

// Home Root Endpoint - System Information & Status Map
app.get('/', (req, res) => {
  res.status(200).json({
    system: "AFYAROOT Backend Server",
    status: "Healthy",
    version: "1.0.0",
    description: "Healthcare Navigation System for Real-Time Care Access (Kenya Master Health Facility Registry Integration)",
    architecture_layers: {
      "1_kmhfr_data_layer": "Static foundation detailing hospital levels, services, location (GIS), and specialties.",
      "2_ai_clinical_triage": "Doctor Brain sorting symptoms to risk classifications and mapping required services (Non-diagnostic).",
      "3_routing_and_scoring": "Algorithm deciding best hospital right now based on Match (40%), Distance (30%), Queue (20%), Level (10%).",
      "4_live_hospital_status": "Reality layer collecting hospital capacity portal feeds and rating data freshness trust.",
      "5_care_delivery_layer": "Booking scheduler with integrated simulated SMS/WhatsApp confirmation workflows."
    },
    extra_integrated_modules: {
      "emergency_mode_engine": "Bypasses standard queues to prioritize nearest emergency-capable unit.",
      "population_and_demand_intelligence": "Aggregated symptom dashboards and regional service gap analysis.",
      "multilingual_rural_interface": "Triage maps native Swahili ('kichwa', 'homa') alongside English inputs.",
      "community_health_worker_mode": "Offline-ready household records synchronization pipeline."
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled server error:", err);
  res.status(500).json({
    success: false,
    error: "Internal Server Error. Please contact backend administrators."
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`===========================================================`);
  console.log(`🚀 AFYAROOT Backend running on port ${PORT}`);
  console.log(`👉 Access home state at http://localhost:${PORT}/`);
  console.log(`===========================================================`);
});
