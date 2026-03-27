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
          email: { type: "string" },
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




};