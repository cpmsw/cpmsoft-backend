const verifyToken = require('../../middleware/verifyToken');
const service = require('./rolePermissions.service');

module.exports = async function (fastify) {

  // -----------------------------
  // GET ROLE PERMISSIONS
  // -----------------------------
  fastify.get('/:id/permissions', {
    preHandler: verifyToken
  }, async (request) => {

    const tenantId = request.user.tenantId;
    const { id } = request.params;

    return await service.getRolePermissions(tenantId, id);
  });

  // -----------------------------
  // SAVE ROLE PERMISSIONS
  // -----------------------------
  fastify.put('/:id/permissions', {
    preHandler: verifyToken,
    schema: {
      body: {
        type: 'object',
        required: ['permissionIds'],
        properties: {
          permissionIds: {
            type: 'array',
            items: { type: 'string' }
          }
        }
      }
    }
  }, async (request) => {

    const tenantId = request.user.tenantId;
    const userId = request.user.id;
    const { id } = request.params;

    await service.saveRolePermissions(
      tenantId,
      userId,
      id,
      request.body.permissionIds
    );

    return { success: true };
  });

};