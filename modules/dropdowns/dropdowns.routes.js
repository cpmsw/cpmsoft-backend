const verifyToken =
  require("../../middleware/verifyToken");

const service =
  require("./dropdowns.service");


module.exports = async function (fastify) {


  // ==================================================
  // GET ALL DROPDOWNS
  // ==================================================

  fastify.get("/", {
    preHandler: verifyToken
  }, async (request) => {

    const tenantId =
      request.user.tenantId;

    return service.getAll(
      tenantId
    );

  });


  // ==================================================
  // GET DROPDOWN LIST BY TYPE
  // ==================================================

  fastify.get("/:type", {
    preHandler: verifyToken
  }, async (request) => {

    const tenantId =
      request.user.tenantId;

    const {
      type
    } = request.params;


    return service.getList(
      tenantId,
      type
    );

  });


  // ==================================================
  // CREATE DROPDOWN VALUE
  // ==================================================

  fastify.post("/:type", {
    preHandler: verifyToken
  }, async (request) => {

    const tenantId =
      request.user.tenantId;

    const userId =
      request.user.userId;

    const {
      type
    } = request.params;


    return service.create(
      tenantId,
      userId,
      type,
      request.body
    );

  });


  // ==================================================
  // UPDATE DROPDOWN VALUE
  // ==================================================

  fastify.put("/:type/:id", {
    preHandler: verifyToken
  }, async (request) => {

    const tenantId =
      request.user.tenantId;

    const userId =
      request.user.userId;

    const {
      id
    } = request.params;


    return service.update(
      tenantId,
      userId,
      id,
      request.body
    );

  });


  // ==================================================
  // DELETE / DEACTIVATE DROPDOWN VALUE
  // ==================================================

  fastify.delete("/:type/:id", {
    preHandler: verifyToken
  }, async (request) => {

    const tenantId =
      request.user.tenantId;

    const userId =
      request.user.userId;

    const {
      id
    } = request.params;


    return service.softDelete(
      tenantId,
      userId,
      id
    );

  });

};