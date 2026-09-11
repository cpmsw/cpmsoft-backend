const verifyToken =
  require("../../middleware/verifyToken");

const service =
  require("cpmsoft-core/rolePermissions");

const requirePermission =
  require("../../middleware/requirePermission");


module.exports =
  async function (fastify) {


    // ---------------------------------
    // GET ROLE ACCESS
    // ---------------------------------
    fastify.get(
      "/:id/access",
      {
        preHandler: [
          verifyToken,
          requirePermission(
            "roles_permissions.view"
          )
        ],

        schema: {
          tags: [
            "Role Permissions"
          ],

          summary:
            "Get role access configuration",

          params: {
            type: "object",
            required: [
              "id"
            ],

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
    // SAVE ROLE ACCESS
    // ---------------------------------
    fastify.put(
      "/:id/access",
      {
        preHandler: [
          verifyToken,
          requirePermission(
            "roles_permissions.edit"
          )
        ],

        schema: {
          tags: [
            "Role Permissions"
          ],

          summary:
            "Save role access configuration",

          params: {
            type: "object",
            required: [
              "id"
            ],

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

  };