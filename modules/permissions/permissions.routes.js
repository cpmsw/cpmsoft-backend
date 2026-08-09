const verifyToken =
  require("../../middleware/verifyToken");

const permissionsService =
  require("cpmsoft-core/permissions");

const permissionBodySchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "permissionKey",
    "permissionName",
    "moduleKey"
  ],
  properties: {
    permissionKey: {
      type: "string",
      minLength: 3,
      description:
        "Unique permission key in module.action format"
    },
    permissionName: {
      type: "string",
      minLength: 1,
      description:
        "Display name for the permission"
    },
    moduleKey: {
      type: "string",
      minLength: 1,
      description:
        "Module that owns the permission"
    },
    isSystem: {
      type: "boolean",
      default: false,
      description:
        "Indicates whether this is a system permission"
    }
  }
};

const permissionIdParamsSchema = {
  type: "object",
  required: ["id"],
  properties: {
    id: {
      type: "string",
      format: "uuid",
      description: "Permission ID"
    }
  }
};

module.exports =
  async function permissionsRoutes(
    fastify
  ) {
    // ---------------------------------
    // LIST PERMISSIONS
    // GET /api/permissions?search=
    // ---------------------------------
    fastify.get("/", {
      preHandler: verifyToken,
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
      const { search } =
        request.query || {};

      return permissionsService
        .getPermissions(search);
    });

    // ---------------------------------
    // LIST GROUPED
    // GET /api/permissions/grouped
    // ---------------------------------
    // Keep before "/:id".
    fastify.get("/grouped", {
      preHandler: verifyToken
    }, async () => {
      return permissionsService
        .getPermissionsGrouped();
    });

    // ---------------------------------
    // AVAILABLE FOR LOGGED-IN TENANT
    // GET /api/permissions/available
    // ---------------------------------
    // Keep before "/:id".
    fastify.get("/available", {
      preHandler: verifyToken,

      schema: {
        tags: ["Permissions"],

        summary:
          "Get permissions available to the tenant",

        description:
          "Returns only resources currently enabled for the logged-in tenant, together with active permissions available for each resource."
      }

    }, async (request) => {

      return permissionsService
        .getAvailablePermissions(
          request.user.tenantId
        );
    });

    // ---------------------------------
    // GET ONE
    // GET /api/permissions/:id
    // ---------------------------------
    fastify.get("/:id", {
      preHandler: verifyToken,
      schema: {
        params:
          permissionIdParamsSchema
      }
    }, async (request) => {
      return permissionsService.getById(
        request.params.id
      );
    });

    // ---------------------------------
    // CREATE
    // POST /api/permissions
    // ---------------------------------
    fastify.post("/", {
      preHandler: verifyToken,
      schema: {
        body: permissionBodySchema
      }
    }, async (request, reply) => {
      const permission =
        await permissionsService
          .createPermission(
            request.user.userId,
            request.body
          );

      return reply
        .code(201)
        .send(permission);
    });

    // ---------------------------------
    // UPDATE
    // PUT /api/permissions/:id
    // ---------------------------------
    fastify.put("/:id", {
      preHandler: verifyToken,
      schema: {
        params:
          permissionIdParamsSchema,
        body: permissionBodySchema
      }
    }, async (request) => {
      return permissionsService
        .updatePermission(
          request.user.userId,
          request.params.id,
          request.body
        );
    });

    // ---------------------------------
    // SOFT DELETE
    // DELETE /api/permissions/:id
    // ---------------------------------
    fastify.delete("/:id", {
      preHandler: verifyToken,
      schema: {
        params:
          permissionIdParamsSchema
      }
    }, async (request) => {
      return permissionsService
        .softDelete(
          request.user.userId,
          request.params.id
        );
    });
  };