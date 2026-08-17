const verifyToken =
  require("../../middleware/verifyToken");

const service =
  require("cpmsoft-core/rolePermissions");

const requirePermission =
  require("../../middleware/requirePermission");

  
module.exports =
  async function (fastify) {


    // ---------------------------------
    // GET FRIENDLY ROLE ACCESS
    // ---------------------------------
    fastify.get(
      "/:id/access",
      {
        preHandler: [
          verifyToken,
          requirePermission("roles_permissions.view")
        ],

        schema: {
          tags: ["Role Permissions"],

          summary:
            "Get role access configuration",

          params: {
            type: "object",
            required: ["id"],

            properties: {
              id: {
                type: "string",
                format: "uuid"
              }
            }
          }
        }
      },

      async (request) => {

        return service.getRoleAccess(
          request.user.tenantId,
          request.params.id
        );
      }
    );


    // ---------------------------------
    // SAVE FRIENDLY ROLE ACCESS
    // ---------------------------------
    fastify.put(
      "/:id/access",
      {
        preHandler: [
          verifyToken,
          requirePermission("roles_permissions.edit")
        ],

        schema: {
          tags: ["Role Permissions"],

          summary:
            "Save role access configuration",

          params: {
            type: "object",
            required: ["id"],

            properties: {
              id: {
                type: "string",
                format: "uuid"
              }
            }
          },

          body: {
            type: "object",
            additionalProperties: false,

            required: [
              "resources"
            ],

            properties: {

              resources: {
                type: "array",

                items: {
                  type: "object",
                  additionalProperties:
                    false,

                  required: [
                    "resourceKey",
                    "access"
                  ],

                  properties: {

                    resourceKey: {
                      type: "string"
                    },

                    access: {
                      type: "string",
                      enum: [
                        "NONE",
                        "READ",
                        "READ_WRITE"
                      ]
                    },

                    canDeactivate: {
                      type: "boolean",
                      default: false
                    }
                  }
                }
              },

              specialPermissionIds: {
                type: "array",

                items: {
                  type: "string",
                  format: "uuid"
                },

                default: []
              }
            }
          }
        }
      },

      async (request) => {

        return service.saveRoleAccess(
          request.user.tenantId,
          request.user.userId,
          request.params.id,
          request.body
        );
      }
    );


    // ---------------------------------
    // GET RAW ROLE PERMISSIONS
    // ---------------------------------
    fastify.get(
      "/:id/permissions",
      {
        preHandler: [
          verifyToken,
          requirePermission("roles.view")
        ]
      },

      async (request) => {

        return service
          .getRolePermissions(
            request.user.tenantId,
            request.params.id
          );
      }
    );


    // ---------------------------------
    // SAVE RAW ROLE PERMISSIONS
    // ---------------------------------
    fastify.put(
      "/:id/permissions",
      {
        preHandler: [
          verifyToken,
          requirePermission("roles.permissions.assign")
        ],

        schema: {
          body: {
            type: "object",
            required: [
              "permissionIds"
            ],

            properties: {
              permissionIds: {
                type: "array",

                items: {
                  type: "string"
                }
              }
            }
          }
        }
      },

      async (request) => {

        await service
          .saveRolePermissions(
            request.user.tenantId,
            request.user.userId,
            request.params.id,
            request.body.permissionIds
          );

        return {
          success: true
        };
      }
    );

  };