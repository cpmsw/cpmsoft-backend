const verifyToken = require('../../middleware/verifyToken');
const service = require('./permissions.service');

module.exports = async function (fastify) {

  fastify.get('/', {
    preHandler: verifyToken
  }, async () => {

    return await service.getPermissionsGrouped();
  });

};