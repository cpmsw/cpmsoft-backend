const service =
  require("cpmsoft-core/roles");

const requirePermission =
  require("../../middleware/requirePermission");

module.exports = async function (fastify) {

  // -----------------------------
  // COUNT
  // -----------------------------
  fastify.get("/count", {
    preHandler: [
      requirePermission(
        "roles_permissions.view"
      )
    ],
    schema: {
      querystring: {
        type: "object",
        properties: {
          search: {
            type: "string"
          },
          status: {
            type: "string",
            enum: [
              "active",
              "inactive",
              "all"
            ]
          }
        }
      }
    }
  }, async (request) => {

    const tenantId =
      request.user.tenantId;

    const {
      search = "",
      status = "active"
    } = request.query;

    const count =
      await service.countRoles(
        tenantId,
        search,
        status
      );

    return { count };
  });

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
          },
          status: {
            type: "string",
            enum: [
              "active",
              "inactive",
              "all"
            ]
          },
          page: {
            type: "integer",
            minimum: 1,
            default: 1
          },
          pageSize: {
            type: "integer",
            minimum: 1,
            maximum: 100,
            default: 100
          }
        }
      }
    }
  }, async (request) => {

    const tenantId =
      request.user.tenantId;

    const {
      search = "",
      status = "active",
      page = 1,
      pageSize = 100
    } = request.query;

    return service.getRoles(
      tenantId,
      search,
      status,
      page,
      pageSize
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

  // -----------------------------
  // RESTORE
  // -----------------------------
  fastify.post("/:id/restore", {
    preHandler: [
      requirePermission(
        "roles_permissions.edit"
      )
    ]
  }, async (request) => {

    const tenantId =
      request.user.tenantId;

    const userId =
      request.user.userId;

    const { id } =
      request.params;

    return service.restoreRole(
      tenantId,
      userId,
      id
    );
  });

};