module.exports = async function (fastify) {
  fastify.register(require('./users.routes'));
};