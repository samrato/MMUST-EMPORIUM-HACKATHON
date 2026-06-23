const express = require('express');
const router = express.Router();
const facilityController = require('../controllers/facilityController');

// GET /api/facilities - Retrieve registry list (with filters)
router.get('/', facilityController.getAllFacilities);

// GET /api/facilities/metadata - Retrieve list of levels, services, and specialties
router.get('/metadata', facilityController.getMetadataCatalogues);

// GET /api/facilities/nearby - Retrieve nearby facilities using GIS coordinates
router.get('/nearby', facilityController.getNearbyFacilities);

// GET /api/facilities/:id - Retrieve detailed facility record with live status
router.get('/:id', facilityController.getFacilityById);

module.exports = router;
