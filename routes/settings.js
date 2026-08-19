const appDb =
  require("cpmsoft-core/common/db/appDb");

const authDb =
  require("cpmsoft-core/common/db/authDb");

const { getTenant } =
  require("../services/tenant");

const requireRole =
  require("../middleware/requireRole");

module.exports = async function (fastify) {

  // ===============================
  // GET SETTINGS MENU
  // Source of truth:
  // authdb.tenant_resources
  // ===============================
  fastify.get(
    "/settings/menu",
    {
      schema: {
        summary:
          "Get settings menu",

        tags: [
          "Settings"
        ],

        response: {
          200: {
            type: "array",

            items: {
              type: "object",

              properties: {
                id: {
                  type: "string"
                },

                label: {
                  type: "string"
                },

                type: {
                  type: "string"
                },

                optionType: {
                  type: [
                    "string",
                    "null"
                  ]
                }
              }
            }
          }
        }
      }
    },

    async (request) => {

      const tenantId =
        request.user.tenantId;


      const result =
        await authDb.query(
          `SELECT
             r.resource_key,
             r.resource_name
           FROM tenant_resources tr
           JOIN resources r
             ON r.id = tr.resource_id
           WHERE tr.tenant_id = $1
             AND tr.is_enabled = true
             AND r.is_active = true
           ORDER BY
             r.display_order,
             r.resource_name`,
          [
            tenantId
          ]
        );


      const menuMap = {
        users: {
          id: "users",
          label: "Users",
          type: "page",
          optionType: null
        },

        roles_permissions: {
          id: "roles",
          label: "Roles & Permissions",
          type: "page",
          optionType: null
        },

        company: {
          id: "company",
          label: "Company",
          type: "page",
          optionType: null
        },

        customers: {
          id: "customers",
          label: "Customers",
          type: "page",
          optionType: null
        },

        status: {
          id: "status",
          label: "Status",
          type: "dropdown",
          optionType: "STATUS"
        }
      };


      return result.rows
        .map(row =>
          menuMap[
          row.resource_key
          ]
        )
        .filter(Boolean);
    }
  );

  // ===============================
  // GET DROPDOWN ITEMS
  // ===============================
  fastify.get('/dropdown/:type', async (request) => {

    const tenant = getTenant(request);
    const { type } = request.params;

    const result = await appDb.query(
      `
    SELECT id,
           dropdown_value,
           dropdown_code,
           sort_order,
           flag_delete
    FROM list_dropdowns
    WHERE tenant = $1
      AND dropdown_type = UPPER($2)
    ORDER BY sort_order
    `,
      [tenant, type]
    );

    return result.rows;
  });

};
