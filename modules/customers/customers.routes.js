const customerService = require('./customers.service');
const requireRole = require('../../middleware/requireRole');

module.exports = async function (fastify) {

  // ===============================
  // GET Customers
  // ===============================
  fastify.get("/", async (request) => {
    const tenantId = request.user.tenantId;
    const search = request.query.search;

    const customers = await customerService.getAll(tenantId, search);

    return { success: true, data: customers };
  });
  // ===============================
  // GET Customer By Id
  // ===============================
  fastify.get('/:id', {
    schema: {
      summary: 'Get customer by id',
      tags: ['Customers'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' }
        }
      }
    }
  }, async (request, reply) => {

    const tenantId = request.user.tenantId;
    const id = request.params.id;

    const customer = await customerService.getById(tenantId, id);

    return { success: true, data: customer };
  });

  // ===============================
  // CREATE Customer
  // ===============================
  fastify.post('/', {
    preHandler: requireRole(['admin', 'manager']),
    schema: {
      summary: 'Create customer',
      tags: ['Customers'],
      body: {
        type: 'object',
        required: ['name'],
        properties: {
          customer_code: { type: 'string', maxLength: 50 },
          name: { type: 'string', minLength: 1 },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string' }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' }
          }
        }
      }
    }
  }, async (request, reply) => {

    const tenantId = request.user.tenantId;
    const userId = request.user.userId;

    const customer = await customerService.create(
      tenantId,
      userId,
      request.body
    );

    reply.code(201);
    return { success: true, data: customer };
  });

  // ===============================
  // UPDATE Customer
  // ===============================
  fastify.put('/:id', {
    preHandler: requireRole(['admin', 'manager']),
    schema: {
      summary: 'Update customer',
      tags: ['Customers'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' }
        }
      },
      body: {
        type: 'object',
        required: ['name'],
        properties: {
          customer_code: { type: 'string', maxLength: 50 },
          name: { type: 'string', minLength: 1 },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {

    const tenantId = request.user.tenantId;
    const userId = request.user.userId;

    const updated = await customerService.update(
      tenantId,
      userId,
      request.params.id,
      request.body
    );

    return { success: true, data: updated };
  });

  // ===============================
  // DELETE Customer (Soft)
  // ===============================
  fastify.delete('/:id', {
    preHandler: requireRole(['admin']),
    schema: {
      summary: 'Delete customer',
      tags: ['Customers'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid' }
        }
      }
    }
  }, async (request, reply) => {

    const tenantId = request.user.tenantId;
    const userId = request.user.userId;

    await customerService.softDelete(
      tenantId,
      userId,
      request.params.id
    );

    return { success: true };
  });

};
