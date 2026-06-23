const dataStore = require('../models/dataStore');
const notificationService = require('../services/notificationService');

/**
 * Create a new appointment booking (Care Delivery Layer)
 */
exports.createBooking = async (req, res) => {
  try {
    const { facilityId, patientName, phoneNumber, date, time, serviceNeeded, language = 'en' } = req.body;

    // Validate inputs
    if (!facilityId || !patientName || !phoneNumber || !date || !time || !serviceNeeded) {
      return res.status(400).json({
        success: false,
        error: "Missing required booking fields: 'facilityId', 'patientName', 'phoneNumber', 'date', 'time', and 'serviceNeeded' are mandatory."
      });
    }

    // Verify facility exists
    const facility = await dataStore.getFacilityById(facilityId);
    if (!facility) {
      return res.status(404).json({
        success: false,
        error: `Facility with ID ${facilityId} not found in KMHFR registry.`
      });
    }

    const booking = await dataStore.addBooking({
      facilityId,
      patientName,
      phoneNumber,
      date,
      time,
      serviceNeeded,
      language
    });

    // Send instant confirmation via SMS/WhatsApp
    await notificationService.sendBookingConfirmation(booking, facility);

    // Simulate scheduling a reminder 2 hours before
    console.log(`[Scheduler] Registered appointment reminder background timer for booking ${booking.id} to trigger at ${date} ${time}`);

    return res.status(201).json({
      success: true,
      message: "Appointment successfully booked. Confirmation SMS/WhatsApp has been sent.",
      data: booking
    });

  } catch (error) {
    console.error("Error in booking creation controller:", error);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error in the care delivery layer."
    });
  }
};

/**
 * Fetch booking details
 */
exports.getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await dataStore.getBookingById(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: `Booking ID ${id} not found.`
      });
    }

    const facility = await dataStore.getFacilityById(booking.facilityId);

    return res.status(200).json({
      success: true,
      data: {
        ...booking,
        facility_name: facility ? facility.name : "Unknown Facility",
        facility_contact: facility ? facility.contact : ""
      }
    });

  } catch (error) {
    console.error("Error retrieving booking details:", error);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error retrieving booking."
    });
  }
};

/**
 * Update booking status (e.g. check-in, completion, cancellation)
 */
exports.updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['pending', 'checked-in', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid or missing status parameter. Must be 'pending', 'checked-in', 'completed', or 'cancelled'."
      });
    }

    const updatedBooking = await dataStore.updateBookingStatus(id, status);

    if (!updatedBooking) {
      return res.status(404).json({
        success: false,
        error: `Booking ID ${id} not found.`
      });
    }

    return res.status(200).json({
      success: true,
      message: `Booking status updated to '${status}'.`,
      data: updatedBooking
    });

  } catch (error) {
    console.error("Error updating booking status:", error);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error updating booking status."
    });
  }
};

/**
 * List bookings filtered by facilityId (for Admin Portal views)
 */
exports.listBookings = async (req, res) => {
  try {
    const { facilityId } = req.query;
    let list = await dataStore.getBookings();

    if (facilityId) {
      list = list.filter(b => b.facilityId === facilityId);
    }

    return res.status(200).json({
      success: true,
      data: list
    });
  } catch (error) {
    console.error("Error listing bookings:", error);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error listing bookings."
    });
  }
};
