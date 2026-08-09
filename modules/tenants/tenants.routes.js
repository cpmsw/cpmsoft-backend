const service =
  require("cpmsoft-core/tenants/tenants.service");

const requirePermission =
  require("../../middleware/requirePermission");

module.exports = async function (fastify) {

  // ---------------------------------
  // SET / TRANSFER PRIMARY USER
  // ---------------------------------
  fastify.put(
    "/primary-user",
    {
      preHandler: [
        requirePermission("users.edit")
      ],

      schema: {
        tags: ["Tenants"],

        summary:
          "Set or transfer Primary User",

        body: {
          type: "object",
          additionalProperties: false,

          required: [
            "userId"
          ],

          properties: {
            userId: {
              type: "string",
              format: "uuid"
            }
          }
        }
      }
    },

    async (request) => {

      const tenantId =
        request.user.tenantId;

      const currentUserId =
        request.user.userId;

      return service.setPrimaryUser(
        tenantId,
        currentUserId,
        request.body.userId
      );
    }
  );

};