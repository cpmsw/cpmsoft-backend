const service =
  require("cpmsoft-core/userRoles");

const requirePermission =
  require("../../middleware/requirePermission");

module.exports =
async function (fastify) {

  // -----------------------------
  // GET USER ROLES
  // -----------------------------
  fastify.get("/:id/roles", {
    preHandler: [
      requirePermission("users.view")
    ],

    schema: {
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
  }, async (request) => {

    const tenantId =
      request.user.tenantId;

    const { id } =
      request.params;

    return service.getUserRoles(
      tenantId,
      id
    );
  });


  // -----------------------------
  // SAVE USER ROLES
  // -----------------------------
  fastify.put("/:id/roles", {
    preHandler: [
      requirePermission("users.edit")
    ],

    schema: {
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
        required: ["roleIds"],

        properties: {
          roleIds: {
            type: "array",
            items: {
              type: "string",
              format: "uuid"
            }
          }
        }
      }
    }
  }, async (request) => {

    const tenantId =
      request.user.tenantId;

    const currentUserId =
      request.user.userId;

    const { id } =
      request.params;

    return service.saveUserRoles(
      tenantId,
      currentUserId,
      id,
      request.body.roleIds
    );
  });

};