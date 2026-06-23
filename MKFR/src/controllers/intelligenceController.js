const dataStore = require('../models/dataStore');

/**
 * Get Aggregate Health Insights (Population & Demand Intelligence Layer)
 * Used by health organizations, governments, and NGOs for demand planning.
 */
exports.getDashboardInsights = async (req, res) => {
  try {
    const logs = await dataStore.getIntelligenceLogs();
    const facilities = await dataStore.getFacilities();

    // 1. Calculate top symptoms
    const symptomsCount = {};
    // 2. Risk distribution
    const riskCount = { critical: 0, high: 0, moderate: 0, "low/moderate": 0, low: 0 };
    // 3. County hotspots
    const countyHotspots = {};

    logs.forEach(log => {
      // Clean and normalize symptoms for grouping
      const symptom = (log.symptom || '').toLowerCase().trim();
      symptomsCount[symptom] = (symptomsCount[symptom] || 0) + 1;

      // Risk
      const risk = log.risk || 'low';
      riskCount[risk] = (riskCount[risk] || 0) + 1;

      // County
      const county = log.county || 'Unknown';
      countyHotspots[county] = (countyHotspots[county] || 0) + 1;
    });

    // Format top symptoms as sorted array
    const sortedSymptoms = Object.entries(symptomsCount)
      .map(([symptom, count]) => ({ symptom, count }))
      .sort((a, b) => b.count - a.count);

    // Format county hotspots
    const sortedHotspots = Object.entries(countyHotspots)
      .map(([county, cases]) => ({ county, cases }))
      .sort((a, b) => b.cases - a.cases);

    // 4. Underserved Health Gaps Detection
    // Analyze if there are counties with high symptom triage demands for specialized services,
    // but lacking local facilities that offer those services.
    const gaps = [];
    const counties = [...new Set(facilities.map(f => f.county))];

    counties.forEach(county => {
      // Find all facilities in this county
      const localFacilities = facilities.filter(f => f.county === county);
      
      // Accumulate all services available in this county
      const availableServices = new Set();
      localFacilities.forEach(f => f.services.forEach(s => availableServices.add(s)));

      // Check if critical specialities like "Cardiology", "Oncology", or "Maternity" are missing
      const criticalServicesToCheck = ["Cardiology", "Oncology", "Maternity", "Emergency Care"];
      const missingServices = criticalServicesToCheck.filter(srv => !availableServices.has(srv));

      // Calculate how many triage cases in this county requested help
      const localTriageCount = logs.filter(log => log.county === county).length;

      if (missingServices.length > 0 && localTriageCount > 0) {
        gaps.push({
          county,
          local_facilities_count: localFacilities.length,
          reported_triage_cases: localTriageCount,
          underserved_critical_services: missingServices,
          recommendation: `Equip at least one Level 4 or 5 facility in ${county} with ${missingServices.join(', ')} to address regional travel distress.`
        });
      }
    });

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        total_triage_sessions_logged: logs.length,
        chw_referrals_synced: (await dataStore.getChwReferrals()).length
      },
      insights: {
        top_symptoms: sortedSymptoms,
        risk_distribution: riskCount,
        regional_hotspots: sortedHotspots,
        healthcare_gaps: gaps
      }
    });

  } catch (error) {
    console.error("Error generating dashboard insights:", error);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error compiling population intelligence."
    });
  }
};

/**
 * Handle Community Health Worker (CHW) Offline Referral Uploads
 * Supports single or batch array syncing.
 */
exports.syncChwReferral = async (req, res) => {
  try {
    const { referrals } = req.body;

    if (!referrals) {
      return res.status(400).json({
        success: false,
        error: "Sync body must contain 'referrals' (either a single referral object or an array of objects)."
      });
    }

    const referralList = Array.isArray(referrals) ? referrals : [referrals];
    const savedReferrals = [];

    for (const ref of referralList) {
      const { chwId, patientName, householdId, symptoms, triageRisk, referredFacilityId } = ref;

      if (!chwId || !patientName || !symptoms || !triageRisk || !referredFacilityId) {
        return res.status(400).json({
          success: false,
          error: "Each referral record must contain 'chwId', 'patientName', 'symptoms', 'triageRisk', and 'referredFacilityId'."
        });
      }

      // Verify facility exists
      const facility = await dataStore.getFacilityById(referredFacilityId);
      if (!facility) {
        return res.status(404).json({
          success: false,
          error: `Facility ID ${referredFacilityId} referred by CHW does not exist.`
        });
      }

      // Add to store
      const saved = await dataStore.addChwReferral({
        chwId,
        patientName,
        householdId: householdId || "HH-GENERIC",
        symptoms,
        triageRisk,
        referredFacilityId,
        synced_at: new Date().toISOString()
      });

      // Log triage details to general logs automatically to feed population intelligence
      await dataStore.logTriageSession({
        symptom: symptoms,
        language: "chw-offline",
        risk: triageRisk,
        county: facility.county,
        is_emergency: triageRisk === 'critical'
      });

      savedReferrals.push(saved);
    }

    return res.status(200).json({
      success: true,
      message: `Successfully synchronized ${savedReferrals.length} offline health records from Community Health Workers.`,
      records_synced: savedReferrals
    });

  } catch (error) {
    console.error("Error syncing CHW referrals:", error);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error syncing offline health worker records."
    });
  }
};

/**
 * List all synchronised CHW referral logs
 */
exports.getChwReferrals = async (req, res) => {
  try {
    const referrals = await dataStore.getChwReferrals();
    
    // Map with facility names asynchronously
    const enriched = await Promise.all(referrals.map(async ref => {
      const facility = await dataStore.getFacilityById(ref.referredFacilityId);
      return {
        ...ref,
        referred_facility_name: facility ? facility.name : "Unknown"
      };
    }));

    return res.status(200).json({
      success: true,
      count: enriched.length,
      data: enriched
    });
  } catch (error) {
    console.error("Error retrieving referrals:", error);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error retrieving health worker logs."
    });
  }
};
