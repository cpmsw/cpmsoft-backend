module.exports = async function (fastify) {
  fastify.register(require('./roles.routes'));
};