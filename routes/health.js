const appDb = require('../db/appDb');

module.exports = async function (fastify) {

  fastify.get('/health', async () => ({
    status: 'ok',
    service: 'cpmsoft-api',
    uptime: process.uptime()
  }));

  fastify.get('/ready', async (request, reply) => {
    try {
      await appDb.query('SELECT 1');
      return { status: 'ready', database: 'ok' };
    } catch (err) {
      reply.code(503);
      return { status: 'not-ready', database: 'down' };
    }
  });
};
