module.exports = async function (fastify) {
  fastify.register(require('./permissions.routes'));
};