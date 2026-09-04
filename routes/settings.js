const appDb =
  require("cpmsoft-core/common/db/appDb");

const authDb =
  require("cpmsoft-core/common/db/authDb");


module.exports = async function (fastify) {

  // =====================================================
  // COMMON NAVIGATION ITEM SCHEMA
  // =====================================================

  const navigationItemSchema = {
    type: "object",

    properties: {
      id: {
        type: "string"
      },

      navKey: {
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
      },

      displayOrder: {
        type: "integer"
      }
    }
  };


  // =====================================================
  // GET USER RESOURCES HAVING VIEW PERMISSION
  //
  // appdb:
  //   user_roles
  //   roles
  //   role_permissions
  //   permissions
  //
  // Returns resource UUIDs the current user may view.
  // =====================================================

  async function getUserViewResourceIds(
    tenantId,
    userId
  ) {

    const result =
      await appDb.query(
        `
        SELECT DISTINCT
          rp.resource_id

        FROM user_roles ur

        JOIN roles r
          ON r.id = ur.role_id
         AND r.tenant_id = ur.tenant_id

        JOIN role_permissions rp
          ON rp.role_id = ur.role_id
         AND rp.tenant_id = ur.tenant_id

        JOIN permissions p
          ON p.id = rp.permission_id

        WHERE ur.tenant_id = $1
          AND ur.user_id = $2
          AND ur.is_active = true
          AND r.is_active = true
          AND p.is_active = true
          AND p.permission_key = 'view'
        `,
        [
          tenantId,
          userId
        ]
      );


    return result.rows.map(
      row => row.resource_id
    );
  }


  // =====================================================
  // GET EFFECTIVE NAVIGATION
  //
  // A navigation item is returned only when:
  //
  // 1. Navigation item is active
  // 2. Resource is active
  // 3. Tenant has resource enabled
  // 4. User has VIEW permission on resource
  // 5. If package_id exists:
  //      package is active AND
  //      tenant has package enabled
  //
  // There are no hard-coded menu/resource mappings.
  // =====================================================

async function getNavigation(
  tenantId,
  userId
) {

  const viewResourceIds =
    await getUserViewResourceIds(
      tenantId,
      userId
    );


  // =====================================================
  // TOP NAVIGATION
  //
  // Source:
  //   tenant_packages
  //   packages
  //
  // Packages are the top-level application navigation.
  // =====================================================

  const topResult =
    await authDb.query(
      `
        SELECT
          p.package_key,
          COALESCE(
            NULLIF(p.display_name, ''),
            p.package_name
          ) AS label,
          p.display_order

        FROM tenant_packages tp

        JOIN packages p
          ON p.id = tp.package_id
         AND p.is_active = true

        JOIN tenants t
          ON t.id = tp.tenant_id
         AND t.is_active = true

        WHERE tp.tenant_id = $1
          AND tp.is_active = true

        ORDER BY
          p.display_order,
          p.package_name
      `,
      [
        tenantId
      ]
    );


  // =====================================================
  // RESOURCE / SIDEBAR NAVIGATION
  //
  // Source:
  //   tenant_packages
  //   package_resources
  //   tenant_resources
  //   resources
  //
  // RBAC:
  //   Only resources for which the current user has VIEW
  //   permission are returned.
  // =====================================================

  let resourceRows = [];

  if (viewResourceIds.length > 0) {

    const resourceResult =
      await authDb.query(
        `
          SELECT
            p.package_key,

            r.resource_key,

            COALESCE(
              NULLIF(r.display_name, ''),
              r.resource_name
            ) AS label,

            pr.display_order

          FROM tenant_packages tp

          JOIN packages p
            ON p.id = tp.package_id
           AND p.is_active = true

          JOIN package_resources pr
            ON pr.package_id = p.id

          JOIN resources r
            ON r.id = pr.resource_id
           AND r.is_active = true

          JOIN tenant_resources tr
            ON tr.tenant_id = tp.tenant_id
           AND tr.resource_id = r.id
           AND tr.is_enabled = true

          JOIN tenants t
            ON t.id = tp.tenant_id
           AND t.is_active = true

          WHERE tp.tenant_id = $1
            AND tp.is_active = true

            AND r.id = ANY($2::uuid[])

            AND (
              r.resource_key <> 'roles_permissions'
              OR t.rbac_enabled = true
            )

          ORDER BY
            p.display_order,
            pr.display_order,
            r.resource_name
        `,
        [
          tenantId,
          viewResourceIds
        ]
      );

    resourceRows =
      resourceResult.rows;
  }


  // =====================================================
  // BUILD RESPONSE
  // =====================================================

  const navigation = {
    top: []
  };


  // Top-level packages.

  for (const row of topResult.rows) {

    navigation.top.push({
      id: row.package_key,
      navKey: row.package_key,
      label: row.label,
      type: "page",
      optionType: null,
      displayOrder: row.display_order
    });
  }


  // Resource sidebars grouped by package_key.

  for (const row of resourceRows) {

    if (!navigation[row.package_key]) {
      navigation[row.package_key] = [];
    }

    navigation[row.package_key].push({
      id: row.resource_key,
      navKey:
        `${row.package_key}_${row.resource_key}`,
      label: row.label,
      type: "page",
      optionType: null,
      displayOrder: row.display_order
    });
  }


  // Compatibility for /settings/menu.

  if (!navigation.settings) {
    navigation.settings = [];
  }


  return navigation;
}

  // =====================================================
  // GET COMPLETE NAVIGATION
  //
  // New source for both:
  //   Top navigation
  //   Settings navigation
  // =====================================================

  fastify.get(
    "/navigation",
    {
      schema: {
        summary:
          "Get effective navigation for current user",

        tags: [
          "Navigation"
        ],

        response: {
          200: {
            type: "object",

            properties: {
              top: {
                type: "array",
                items:
                  navigationItemSchema
              },

              settings: {
                type: "array",
                items:
                  navigationItemSchema
              }
            },

            additionalProperties: {
              type: "array",
              items:
                navigationItemSchema
            }
          }
        }
      }
    },

    async (request) => {

      const tenantId =
        request.user.tenantId;

      const userId =
        request.user.userId;


      return getNavigation(
        tenantId,
        userId
      );
    }
  );


  // =====================================================
  // GET SETTINGS MENU
  //
  // Compatibility endpoint.
  //
  // Uses EXACTLY the same navigation engine.
  // No separate menu logic.
  // =====================================================

  fastify.get(
    "/settings/menu",
    {
      schema: {
        summary:
          "Get settings navigation for current user",

        tags: [
          "Settings"
        ],

        response: {
          200: {
            type: "array",

            items:
              navigationItemSchema
          }
        }
      }
    },

    async (request) => {

      const tenantId =
        request.user.tenantId;

      const userId =
        request.user.userId;


      const navigation =
        await getNavigation(
          tenantId,
          userId
        );


      return navigation.settings;
    }
  );

};