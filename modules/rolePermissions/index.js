module.exports = async function (fastify) {
  fastify.register(require('./rolePermissions.routes'));
};