const sendEmail = require('./emailService');

// Simple SMS stub – extend with real provider later
async function sendSms(to, message) {
  console.log(`[SMS Stub] To: ${to} | Message: ${message}`);
  return true;
}

// Simple notification helper for appointments & system events
async function notifyUser({ email, phone, subject, text }) {
  const results = {};
  if (email) {
    try {
      await sendEmail(email, subject, text);
      results.email = 'sent';
    } catch (e) {
      results.email = 'failed';
    }
  }
  if (phone) {
    try {
      await sendSms(phone, text);
      results.sms = 'sent';
    } catch (e) {
      results.sms = 'failed';
    }
  }
  return results;
}

module.exports = {
  notifyUser,
};
