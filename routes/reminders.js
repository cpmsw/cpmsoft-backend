const appDb = require('../db/appDb');

module.exports = async function (fastify) {

  fastify.post('/reminders', {
    preHandler: fastify.verifyToken,
    schema: {
      summary: 'Schedule an email reminder',
      tags: ['Reminders'],
      security: [{ bearerAuth: [] }],
      body: {
        type: 'object',
        required: ['email_to', 'subject', 'body', 'send_at'],
        properties: {
          email_to: { 
            type: 'string', 
            format: 'email'
          },
          subject: { 
            type: 'string'
          },
          body: { 
            type: 'string'
          },
          send_at: { 
            type: 'string',
            format: 'date-time'
          },
          reminder_type: {
            type: 'string',
            default: 'general'
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' }
          }
        }
      }
    }
  }, async (request) => {

    const {
      email_to,
      subject,
      body,
      send_at,
      reminder_type = 'general'
    } = request.body;

    await appDb.query(
      `
      INSERT INTO scheduled_reminders
      (tenant_id, reminder_type, email_to, subject, body, send_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [request.user.tenantId, reminder_type, email_to, subject, body, send_at]
    );

    return { status: 'scheduled' };
  });

};
