const verifyToken = require('../../middleware/verifyToken');
const service = require('./users.service');

module.exports = async function (fastify) {

  // GET USERS
  fastify.get('/', {
    preHandler: verifyToken
  }, async (request) => {
    const tenantId = request.user.tenantId;
    const { search } = request.query;
    return service.getUsers(tenantId, search);
  });

  // COUNT USERS
  fastify.get('/count', {
    preHandler: verifyToken
  }, async (request) => {
    const tenantId = request.user.tenantId;
    const count = await service.countUsers(tenantId);
    return { count };
  });

  // GET ONE USER
  fastify.get('/:id', {
    preHandler: verifyToken
  }, async (request) => {
    const tenantId = request.user.tenantId;
    const { id } = request.params;
    return service.getById(tenantId, id);
  });

  // CREATE USER
  fastify.post('/', {
    preHandler: verifyToken,
    schema: {
      body: {
        type: "object",
        required: ["first_name", "last_name", "email"],
        properties: {
          id: { type: "string", format: "uuid", nullable: true },
          first_name: { type: "string" },
          last_name: { type: "string" },
          email: { type: 'string', format: 'email' },
          excludeId: { type: 'string', format: 'uuid', nullable: true },
          phone: { type: "string" },
          job_title: { type: "string" },
          department: { type: "string" },
          password: { type: "string" },
          is_active: { type: "boolean" },
          twofa_required: { type: "boolean" }
        }
      }
    }
  }, async (request) => {

    const tenantId = request.user.tenantId;
    const userId = request.user.userId;

    return service.create(
      tenantId,
      userId,
      request.body
    );

  });
  // UPDATE USER
  fastify.put('/:id', {
    preHandler: verifyToken
  }, async (request) => {
    const tenantId = request.user.tenantId;
    const userId = request.user.userId;
    const { id } = request.params;
    return service.update(tenantId, userId, id, request.body);
  });

  // DELETE USER
  fastify.delete('/:id', {
    preHandler: verifyToken
  }, async (request) => {
    console.log("🔥 SOFT DELETE ROUTE HIT");
    const tenantId = request.user.tenantId;
    const userId = request.user.userId;
    const { id } = request.params;
    return service.softDelete(tenantId, userId, id);
  });

  //CHECK EMAIL
  fastify.get('/check-email', {
    preHandler: verifyToken,
    schema: {
      querystring: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email' }
        }
      }
    }
  }, async (request) => {

    const tenantId = request.user.tenantId;
    const { email } = request.query;

    return service.checkEmailExists(tenantId, email);

  });

  //RESEND-INVITE
  fastify.post('/resend-invite/:id', {
    preHandler: verifyToken,
    schema: {
      summary: 'Resend activation code',
      tags: ['Users'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' }
        }
      }
    }
  }, async (request) => {

    const tenantId = request.user.tenantId;
    const { id } = request.params;

    return service.resendInvite(tenantId, id);
  });

};