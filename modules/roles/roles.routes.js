const service =
  require("cpmsoft-core/roles");

const requirePermission =
  require("../../middleware/requirePermission");

module.exports = async function (fastify) {

  // -----------------------------
  // GET ROLES
  // -----------------------------
  fastify.get("/", {
    preHandler: [
      requirePermission("roles_permissions.view")
    ],
    schema: {
      querystring: {
        type: "object",
        properties: {
          search: {
            type: "string"
          }
        }
      }
    }
  }, async (request) => {

    const tenantId =
      request.user.tenantId;

    const { search } =
      request.query;

    return service.getRoles(
      tenantId,
      search
    );
  });


  // -----------------------------
  // GET ONE
  // -----------------------------
  fastify.get("/:id", {
    preHandler: [
      requirePermission("roles_permissions.view")
    ]
  }, async (request) => {

    const tenantId =
      request.user.tenantId;

    const { id } =
      request.params;

    return service.getById(
      tenantId,
      id
    );
  });


  // -----------------------------
  // CREATE
  // -----------------------------
  fastify.post("/", {
    preHandler: [
      requirePermission("roles_permissions.create")
    ],
    schema: {
      body: {
        type: "object",
        required: [
          "roleCode",
          "roleName"
        ],
        properties: {
          roleCode: {
            type: "string"
          },
          roleName: {
            type: "string"
          },
          description: {
            type: "string"
          }
        }
      }
    }
  }, async (request) => {

    const tenantId =
      request.user.tenantId;

    const userId =
      request.user.userId;

    return service.createRole(
      tenantId,
      userId,
      request.body
    );
  });


  // -----------------------------
  // UPDATE
  // -----------------------------
  fastify.put("/:id", {
    preHandler: [
      requirePermission("roles_permissions.edit")
    ],
    schema: {
      body: {
        type: "object",
        required: [
          "roleName"
        ],
        properties: {
          roleName: {
            type: "string"
          },
          description: {
            type: "string"
          }
        }
      }
    }
  }, async (request) => {

    const tenantId =
      request.user.tenantId;

    const userId =
      request.user.userId;

    const { id } =
      request.params;

    return service.updateRole(
      tenantId,
      userId,
      id,
      request.body
    );
  });


  // -----------------------------
  // DELETE
  // -----------------------------
  fastify.delete("/:id", {
    preHandler: [
      requirePermission("roles_permissions.deactivate")
    ]
  }, async (request) => {

    const tenantId =
      request.user.tenantId;

    const userId =
      request.user.userId;

    const { id } =
      request.params;

    await service.softDelete(
      tenantId,
      userId,
      id
    );

    return {
      success: true
    };
  });

};