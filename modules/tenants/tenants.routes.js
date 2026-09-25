const service =
  require("cpmsoft-core/tenants/tenants.service");

const auditEvents =
  require("cpmsoft-core/audit_events");

const authDb =
  require("cpmsoft-core/common/db/authDb");

const requirePermission =
  require("../../middleware/requirePermission");


// ==================================================
// RESOLVE EVENT HISTORY USER NAMES
// ==================================================

async function addEventUserNames(
  tenantId,
  history
) {

  const items =
    Array.isArray(
      history?.items
    )
      ? history.items
      : [];


  const userIds = [
    ...new Set(
      items
        .map(
          item =>
            item.created_by
        )
        .filter(Boolean)
    )
  ];


  if (
    userIds.length === 0
  ) {
    return history;
  }


  const result =
    await authDb.query(
      `
        SELECT
          id,
          first_name,
          last_name

        FROM users

        WHERE tenant_id = $1
          AND id = ANY($2::uuid[])
      `,
      [
        tenantId,
        userIds
      ]
    );


  const names =
    new Map();


  for (
    const user
    of result.rows
  ) {

    const fullName = [
      user.first_name,
      user.last_name
    ]
      .filter(Boolean)
      .join(" ")
      .trim();


    names.set(
      user.id,
      fullName ||
      "Unknown User"
    );
  }


  return {
    ...history,

    items:
      items.map(
        item => ({
          ...item,

          created_by_name:
            names.get(
              item.created_by
            ) ||
            "Unknown User"
        })
      )
  };
}

module.exports = async function (fastify) {

  // ---------------------------------
  // GET EVENT HISTORY
  // ---------------------------------
  fastify.get(
    "/event-history",
    {
      preHandler: [
        requirePermission("users.view")
      ],

      schema: {
        tags: ["Tenants"],

        summary:
          "Get Tenant Event History",

        querystring: {
          type: "object",

          properties: {
            page: {
              type: "integer",
              minimum: 1,
              default: 1
            },

            pageSize: {
              type: "integer",
              minimum: 1,
              maximum: 100,
              default: 25
            }
          },

          additionalProperties:
            false
        }
      }
    },

    async (request) => {

      const tenantId =
        request.user.tenantId;

      const {
        page,
        pageSize
      } = request.query;


      const history =
        await auditEvents.getEvents(
          tenantId,
          {
            page,
            pageSize
          }
        );


      return addEventUserNames(
        tenantId,
        history
      );
    }
  );

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