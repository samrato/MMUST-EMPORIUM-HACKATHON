const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');

// POST /api/bookings - Book a new appointment
router.post('/', bookingController.createBooking);

// GET /api/bookings/list - List bookings filtered by facilityId (Admin Portal queries)
router.get('/list', bookingController.listBookings);

// GET /api/bookings/:id - View booking details
router.get('/:id', bookingController.getBookingById);

// PUT /api/bookings/:id/status - Update booking status
router.put('/:id/status', bookingController.updateBookingStatus);

module.exports = router;
