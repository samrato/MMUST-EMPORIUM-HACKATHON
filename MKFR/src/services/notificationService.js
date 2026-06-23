/**
 * Notification Service (SMS/WhatsApp and Appointment Reminders)
 * Simulates sending patient reminders and instant notifications via text message channels.
 */

const fs = require('fs');
const path = require('path');

const SMS_LOG_PATH = path.join(__dirname, '../../logs/sent_notifications.log');

// Ensure log folder exists
if (!fs.existsSync(path.dirname(SMS_LOG_PATH))) {
  fs.mkdirSync(path.dirname(SMS_LOG_PATH), { recursive: true });
}

/**
 * Simulates sending an SMS or WhatsApp message
 * Logs output to console and appends to a log file for auditability.
 * @param {object} params
 * @param {string} params.to - Phone number of recipient
 * @param {string} params.message - The text message body
 * @param {'SMS'|'WhatsApp'} params.channel - Delivery channel
 * @returns {Promise<boolean>}
 */
async function sendNotification({ to, message, channel = 'SMS' }) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] CHANNEL: ${channel} | TO: ${to} | MESSAGE: "${message}"\n`;

  // Write to log file
  fs.appendFileSync(SMS_LOG_PATH, logEntry, 'utf8');

  // Log to console (simulating carrier API response)
  console.log(`\n--- OUTGOING ${channel} MESSAGE ---`);
  console.log(`Recipient: ${to}`);
  console.log(`Content:   ${message}`);
  console.log(`Status:    Sent (Success)\n---------------------------------\n`);

  return true;
}

/**
 * Sends booking confirmation message to patient
 */
async function sendBookingConfirmation(booking, facility) {
  const messageEn = `Jambo! Your booking for ${facility.name} (Ref: ${booking.id}) on ${booking.date} at ${booking.time} is CONFIRMED. Present this message at triage. For emergencies, call ${facility.contact}. Powered by AFYAROOT.`;
  
  const messageSw = `Jambo! Uhifadhi wako katika ${facility.name} (Nambari ya Rejea: ${booking.id}) tarehe ${booking.date} saa ${booking.time} IMETHIBITISHWA. Onyesha ujumbe huu wakati wa kufanyiwa vipimo vya kwanza (triage). Kwa dharura, piga ${facility.contact}. AFYAROOT.`;

  const selectedMsg = booking.language === 'sw' ? messageSw : messageEn;
  const preferredChannel = booking.phoneNumber.startsWith('+2547') || booking.phoneNumber.startsWith('07') ? 'SMS' : 'WhatsApp';

  return sendNotification({
    to: booking.phoneNumber,
    message: selectedMsg,
    channel: preferredChannel
  });
}

/**
 * Simulates sending an automated reminder 2 hours before the scheduled time
 */
async function sendAppointmentReminder(booking, facility) {
  const messageEn = `Hi ${booking.patientName}, this is a reminder for your upcoming appointment at ${facility.name} today at ${booking.time}. Live queue count is currently ${facility.live_status?.queue_count || 5} patients. See you soon!`;
  
  const messageSw = `Habari ${booking.patientName}, huu ni ukumbusho wa miadi yako ya leo katika ${facility.name} saa ${booking.time}. Foleni ya sasa hivi ina wagonjwa ${facility.live_status?.queue_count || 5}. Karibu!`;

  const selectedMsg = booking.language === 'sw' ? messageSw : messageEn;
  return sendNotification({
    to: booking.phoneNumber,
    message: selectedMsg,
    channel: 'SMS'
  });
}

module.exports = {
  sendNotification,
  sendBookingConfirmation,
  sendAppointmentReminder
};
