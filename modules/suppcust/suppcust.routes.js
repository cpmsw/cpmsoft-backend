const verifyToken =
  require('../../middleware/verifyToken');

const requirePermission =
  require('../../middleware/requirePermission');

const service =
  require('./suppcust.service');

const accessService =
  require('../../services/access.service');


async function requireSuppcustPermission(
  request,
  reply,
  action
) {
  const tenantId =
    request.user?.tenantId;

  const userId =
    request.user?.userId;

  const { id } =
    request.params;


  const record =
    await service.getById(
      tenantId,
      id
    );


  if (!record) {
    return reply.code(404).send({
      error: "Not Found",
      code: "SUPPCUST_NOT_FOUND",
      message:
        "Customer or Supplier was not found."
    });
  }


  const permissions = [];

  if (record.isCustomer) {
    permissions.push(
      `customers.${action}`
    );
  }

  if (record.isSupplier) {
    permissions.push(
      `suppliers.${action}`
    );
  }


  if (permissions.length === 0) {
    return reply.code(403).send({
      error: "Forbidden",
      code: "PERMISSION_DENIED",
      message:
        "You do not have permission to perform this action."
    });
  }


  for (const permissionKey of permissions) {

    const allowed =
      await accessService.hasPermission(
        tenantId,
        userId,
        permissionKey
      );

    if (allowed) {
      request.suppcustRecord =
        record;

      return;
    }
  }


  return reply.code(403).send({
    error: "Forbidden",
    code: "PERMISSION_DENIED",
    message:
      "You do not have permission to perform this action."
  });
}

module.exports = async function (fastify) {

  // -----------------------------
  // GET CUSTOMERS
  // -----------------------------
  fastify.get('/customers', {
    preHandler: [
      verifyToken,
      requirePermission('customers.view')
    ]
  }, async (request) => {

    const tenantId = request.user.tenantId;
    const { search } = request.query;

    return service.getCustomers(
      tenantId,
      search
    );
  });

  // -----------------------------
  // GET SUPPLIERS
  // -----------------------------
  fastify.get('/suppliers', {
    preHandler: [
      verifyToken,
      requirePermission('suppliers.view')
    ]
  }, async (request) => {

    const tenantId = request.user.tenantId;
    const { search } = request.query;

    return service.getSuppliers(tenantId, search);
  });


  // -----------------------------
  // COUNT
  // -----------------------------
  fastify.get('/count', {
    preHandler: [
      verifyToken,
      async (request, reply) => {

        const type = request.query.type;

        const permission =
          type === "customer"
            ? "customers.view"
            : type === "supplier"
              ? "suppliers.view"
              : null;

        if (!permission) {
          return reply.code(400).send({
            message: "Invalid type"
          });
        }

        return requirePermission(permission)(
          request,
          reply
        );
      }
    ]
  }, async (request) => {

    const tenantId =
      request.user.tenantId;

    const type =
      request.query.type;

    const column =
      type === "customer"
        ? "is_customer"
        : "is_supplier";

    const count =
      await service.countSuppcust(
        tenantId,
        column
      );

    return { count };
  });


  // -----------------------------
  // GET ONE
  // -----------------------------
  fastify.get('/:id', {
    preHandler: [
      verifyToken,
      async (request, reply) =>
        requireSuppcustPermission(
          request,
          reply,
          'view'
        )
    ]
  }, async (request) => {

    return request.suppcustRecord;
  });


  // -----------------------------
  // CREATE CUSTOMER
  // -----------------------------
  fastify.post('/customers', {
    preHandler: [
      verifyToken,
      requirePermission('customers.create')
    ]
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
    preHandler: [
      verifyToken,
      requirePermission('suppliers.create')
    ]
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
    preHandler: [
      verifyToken,
      async (request, reply) =>
        requireSuppcustPermission(
          request,
          reply,
          'edit'
        )
    ]
  }, async (request, reply) => {

    try {

      const tenantId =
        request.user.tenantId;

      const userId =
        request.user.userId;

      const { id } =
        request.params;

      return await service.update(
        tenantId,
        userId,
        id,
        request.body
      );

    } catch (err) {

      if (
        err.code === "23514" &&
        err.constraint ===
        "chk_email_format"
      ) {
        return reply.code(400).send({
          message:
            "Invalid email format"
        });
      }

      throw err;
    }
  });
  // -----------------------------
  // DELETE
  // -----------------------------
  fastify.delete('/:id', {
    preHandler: [
      verifyToken,
      async (request, reply) =>
        requireSuppcustPermission(
          request,
          reply,
          'deactivate'
        )
    ]
  }, async (request) => {

    const tenantId =
      request.user.tenantId;

    const userId =
      request.user.userId;

    const { id } =
      request.params;

    return service.softDelete(
      tenantId,
      userId,
      id
    );
  });

};