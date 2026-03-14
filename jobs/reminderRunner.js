const { sendEmail } = require('../services/emailService');
const {
  getDueReminders,
  markSent,
  markFailed
} = require('../services/reminders');

function startReminderRunner() {
  console.log('⏰ Reminder runner started');

  setInterval(async () => {
    try {
      const reminders = await getDueReminders(10);

      for (const r of reminders) {
        try {
          await sendEmail({
            to: r.email_to,
            subject: r.subject,
            html: r.body
          });

          await markSent(r.id);
        } catch (err) {
          await markFailed(r.id, err.message);
        }
      }
    } catch (err) {
      console.error('Reminder runner error:', err.message);
    }
  }, 60 * 1000); // every 60 seconds
}

module.exports = { startReminderRunner };
