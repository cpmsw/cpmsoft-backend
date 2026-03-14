const verifyToken = require('../../middleware/verifyToken');
const service = require('./suppcust.service');

module.exports = async function (fastify) {

  // -----------------------------
  // GET CUSTOMERS
  // -----------------------------
  fastify.get('/customers', {
    preHandler: verifyToken
  }, async (request) => {

    const tenantId = request.user.tenantId;
    const { search } = request.query;

    return service.getCustomers(tenantId, search);
  });


  // -----------------------------
  // GET SUPPLIERS
  // -----------------------------
  fastify.get('/suppliers', {
    preHandler: verifyToken
  }, async (request) => {

    const tenantId = request.user.tenantId;
    const { search } = request.query;

    return service.getSuppliers(tenantId, search);
  });


  // -----------------------------
  // COUNT
  // -----------------------------
  fastify.get('/count', {
    preHandler: verifyToken
  }, async (request) => {

    const tenantId = request.user.tenantId;
    const type = request.query.type;

    const column =
      type === "customer"
        ? "is_customer"
        : "is_supplier";

    const count = await service.countSuppcust(
      tenantId,
      column
    );

    return { count };
  });


  // -----------------------------
  // GET ONE
  // -----------------------------
  fastify.get('/:id', {
    preHandler: verifyToken
  }, async (request) => {

    const tenantId = request.user.tenantId;
    const { id } = request.params;

    return service.getById(tenantId, id);
  });


// -----------------------------
// CREATE CUSTOMER
// -----------------------------
fastify.post('/customers', {
  preHandler: verifyToken
}, async (request, reply) => {

  try {

    const tenantId = request.user.tenantId;
    const userId = request.user.userId;

    return await service.createCustomer(
      tenantId,
      userId,
      request.body
    );

  } catch (err) {

    if (err.code === "23514") {

      // email check constraint
      if (err.constraint === "chk_email_format") {
        return reply.code(400).send({
          message: "Invalid email format"
        });
      }

    }

    throw err;

  }

});

// -----------------------------
// CREATE SUPPLIER
// -----------------------------
fastify.post('/suppliers', {
  preHandler: verifyToken
}, async (request, reply) => {

  try {

    const tenantId = request.user.tenantId;
    const userId = request.user.userId;

    return await service.createSupplier(
      tenantId,
      userId,
      request.body
    );

  } catch (err) {

    if (err.code === "23514") {

      // email check constraint
      if (err.constraint === "chk_email_format") {
        return reply.code(400).send({
          message: "Invalid email format"
        });
      }

    }

    throw err;

  }

});

// -----------------------------
// UPDATE
// -----------------------------
fastify.put('/:id', {
  preHandler: verifyToken
}, async (request, reply) => {

  try {

    const tenantId = request.user.tenantId;
    const userId = request.user.userId;
    const { id } = request.params;

    return await service.update(
      tenantId,
      userId,
      id,
      request.body
    );

  } catch (err) {

    if (err.code === "23514") {

      if (err.constraint === "chk_email_format") {
        return reply.code(400).send({
          message: "Invalid email format"
        });
      }

    }

    throw err;

  }

});

  // -----------------------------
  // DELETE
  // -----------------------------
  fastify.delete('/:id', {
    preHandler: verifyToken
  }, async (request) => {

    const tenantId = request.user.tenantId;
    const userId = request.user.userId;
    const { id } = request.params;

    return service.softDelete(
      tenantId,
      userId,
      id
    );
  });

};