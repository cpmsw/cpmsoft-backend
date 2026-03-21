const verifyToken = require('../../middleware/verifyToken');
const service = require('./roles.service');
const requirePermission = require('../../middleware/requirePermission');

module.exports = async function (fastify) {

  // -----------------------------
  // GET ROLES
  // -----------------------------
  fastify.get('/', {
    preHandler: [verifyToken,
    requirePermission('roles.view')],
    schema: {
      querystring: {
        type: 'object',
        properties: {
          search: { type: 'string' }
        }
      }
    }
  }, async (request) => {

    const tenantId = request.user.tenantId;
    const { search } = request.query;

    return await service.getRoles(tenantId, search);
  });

  // -----------------------------
  // GET ONE
  // -----------------------------
  fastify.get('/:id', {
    preHandler: verifyToken
  }, async (request) => {

    const tenantId = request.user.tenantId;
    const { id } = request.params;

    return await service.getById(tenantId, id);
  });

  // -----------------------------
  // CREATE
  // -----------------------------
  fastify.post('/', {
    preHandler: [verifyToken,requirePermission('roles.create')],
    schema: {
      body: {
        type: 'object',
        required: ['roleCode', 'roleName'],
        properties: {
          roleCode: { type: 'string' },
          roleName: { type: 'string' },
          description: { type: 'string' }
        }
      }
    }
  }, async (request) => {

    const tenantId = request.user.tenantId;
    const userId = request.user.id;

    return await service.createRole(tenantId, userId, request.body);
  });

  // -----------------------------
  // UPDATE
  // -----------------------------
  fastify.put('/:id', {
  preHandler: [verifyToken,requirePermission('roles.edit')],
  schema: {
    body: {
      type: 'object',
      required: ['roleName'],
      properties: {
        roleName: { type: 'string' },
        description: { type: 'string' }
      }
    }
  }
}, async (request) => {

  const tenantId = request.user.tenantId;
  const userId = request.user.id;
  const { id } = request.params;

  return await service.updateRole(
    tenantId,
    userId,
    id,
    request.body
  );
});

  // -----------------------------
  // DELETE
  // -----------------------------
  fastify.delete('/:id', {
    preHandler: [verifyToken,requirePermission('roles.edit')]
  }, async (request) => {

    const tenantId = request.user.tenantId;
    const userId = request.user.id;
    const { id } = request.params;

    await service.softDelete(tenantId, userId, id);

    return { success: true };
  });

};