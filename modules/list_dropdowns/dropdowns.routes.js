const verifyToken = require('../../middleware/verifyToken');
const service = require('./dropdowns.service');

module.exports = async function (fastify) {

  fastify.get('/dropdowns', {
    preHandler: verifyToken
  }, async (request) => {

    const tenantId = request.user.tenantId;

    return service.getAll(tenantId);
  });
  
  // -----------------------------
  // GET DROPDOWN LIST
  // -----------------------------
  fastify.get('/dropdowns/:type', {
    preHandler: verifyToken
  }, async (request) => {

    const tenantId = request.user.tenantId;
    const { type } = request.params;

    return service.getList(tenantId, type);
  });

  // -----------------------------
  // CREATE
  // -----------------------------
  fastify.post('/dropdowns/:type', {
    preHandler: verifyToken
  }, async (request) => {

    const tenantId = request.user.tenantId;
    const userId = request.user.userId;
    const { type } = request.params;

    return service.create(tenantId, userId, type, request.body);
  });

  // -----------------------------
  // UPDATE
  // -----------------------------
  fastify.put('/dropdowns/:type/:id', {
    preHandler: verifyToken
  }, async (request) => {

    const tenantId = request.user.tenantId;
    const userId = request.user.userId;

    const { id } = request.params;

    return service.update(tenantId, userId, id, request.body);
  });

  // -----------------------------
  // DELETE
  // -----------------------------
  fastify.delete('/dropdowns/:type/:id', {
    preHandler: verifyToken
  }, async (request) => {

    const tenantId = request.user.tenantId;
    const userId = request.user.userId;
    const { id } = request.params;

    return service.softDelete(tenantId, userId, id);
  });

};