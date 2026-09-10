const auditService =
  require(
    "cpmsoft-core/audit"
  );

const authDb =
  require(
    "cpmsoft-core/common/db/authDb"
  );

const appDb =
  require(
    "cpmsoft-core/common/db/appDb"
  );

const requirePermission =
  require(
    "../../../middleware/requirePermission"
  );


// ==================================================
// RESOLVE HISTORY USER NAMES
// ==================================================

async function addUserNames(
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
            item.changedBy
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

          changedByName:
            names.get(
              item.changedBy
            ) ||
            "Unknown User"
        })
      )
  };
}


// ==================================================
// ROUTES
// ==================================================

module.exports =
  async function (fastify) {

    fastify.get(
      "/",
      {

        preHandler: [
          requirePermission(
            "users.view"
          )
        ],

        schema: {

          tags: [
            "Users"
          ],

          summary:
            "Get user history",

          querystring: {

            type: "object",

            properties: {

              entityType: {
                type: "string"
              },

              action: {
                type: "string",
                enum: [
                  "CREATE",
                  "UPDATE",
                  "DELETE",
                  "RESTORE"
                ]
              },

              userSearch: {
                type: "string",
                maxLength: 500
              },

              dateFrom: {
                type: "string",
                format: "date"
              },

              dateTo: {
                type: "string",
                format: "date"
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
                default: 25
              }

            },

            additionalProperties:
              false
          }

        }

      },
      async request => {

        const tenantId =
          request.user.tenantId;

        const permissions =
          request.user.permissions ||
          [];

        const {
          userId
        } = request.params;

        const {
          entityType,
          action,
          userSearch,
          dateFrom,
          dateTo,
          page,
          pageSize
        } = request.query;


        const history =
          await auditService.getHistory(
            tenantId,
            "user",
            userId,
            {
              entityType,
              action,
              userSearch,
              dateFrom,
              dateTo,
              page,
              pageSize
            },
            permissions,
            [
              authDb,
              appDb
            ]
          );

        return addUserNames(
          tenantId,
          history
        );
      }
    );

  };