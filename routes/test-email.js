const { sendEmail } = require('../services/emailService');

module.exports = async function (fastify) {

  fastify.post('/test-email', {
    schema: {
      summary: 'Send test email',
      tags: ['Email'],
      body: {
        type: 'object',
        required: ['to'],
        properties: {
          to: { type: 'string', format: 'email' },
          subject: { type: 'string' },
          message: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            result: { type: 'object' }
          }
        }
      }
    }
  }, async (request, reply) => {

    const { to, subject, message } = request.body;

    const result = await sendEmail({
      to,
      subject: subject || 'CPMSOFT Email Test',
      text: message || 'This is a test email from CPMSOFT API',
      html: `<p>${message || 'This is a test email from CPMSOFT API'}</p>`
    });

    return {
      status: 'sent',
      result
    };
  });

};
