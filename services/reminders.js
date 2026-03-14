const appDb = require('../db/appDb');

/**
 * Fetch due reminders safely.
 * Uses FOR UPDATE SKIP LOCKED so multiple instances
 * cannot process the same reminder.
 */
async function getDueReminders(limit = 10) {
  const client = await appDb.connect();

  try {
    await client.query('BEGIN');

    const result = await client.query(
      `
      SELECT *
      FROM scheduled_reminders
      WHERE send_at <= now()
        AND status = 'pending'
        AND sent = false
        AND failed = false
      ORDER BY send_at
      FOR UPDATE SKIP LOCKED
      LIMIT $1
      `,
      [limit]
    );

    await client.query('COMMIT');

    return result.rows;
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("getDueReminders error:", err.message);
    return [];
  } finally {
    client.release();
  }
}


/**
 * Mark reminder as successfully sent.
 * Keeps status + sent flag in sync.
 */
async function markSent(id) {
  try {
    await appDb.query(
      `
      UPDATE scheduled_reminders
      SET status = 'sent',
          sent = true,
          sent_at = now()
      WHERE id = $1
      `,
      [id]
    );
  } catch (err) {
    console.error("markSent error:", err.message);
  }
}


/**
 * Mark reminder as failed.
 * Stores error message safely (truncated).
 */
async function markFailed(id, error) {
  try {
    await appDb.query(
      `
      UPDATE scheduled_reminders
      SET status = 'failed',
          failed = true,
          failure_reason = LEFT($2, 1000),
          failed_at = now()
      WHERE id = $1
      `,
      [id, error?.toString() || "Unknown error"]
    );
  } catch (err) {
    console.error("markFailed error:", err.message);
  }
}

module.exports = {
  getDueReminders,
  markSent,
  markFailed
};