const verifyToken = require('../../middleware/verifyToken');
const service = require('./userRoles.service');

module.exports = async function (fastify) {

  // -----------------------------
  // GET USER ROLES
  // -----------------------------
  fastify.get('/:id/roles', {
    preHandler: verifyToken
  }, async (request) => {

    const tenantId = request.user.tenantId;
    const { id } = request.params;

    return await service.getUserRoles(tenantId, id);
  });

  // -----------------------------
  // SAVE USER ROLES
  // -----------------------------
  fastify.put('/:id/roles', {
    preHandler: verifyToken,
    schema: {
      body: {
        type: 'object',
        required: ['roleIds'],
        properties: {
          roleIds: {
            type: 'array',
            items: { type: 'string' }
          }
        }
      }
    }
  }, async (request) => {

    const tenantId = request.user.tenantId;
    const currentUserId = request.user.id;
    const { id } = request.params;

    await service.saveUserRoles(
      tenantId,
      currentUserId,
      id,
      request.body.roleIds
    );

    return { success: true };
  });

};