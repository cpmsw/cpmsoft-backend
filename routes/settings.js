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


    if (viewResourceIds.length === 0) {
      return {
        top: [],
        settings: []
      };
    }


    const result =
      await authDb.query(
        `
        SELECT
          n.nav_key,
          n.label,
          n.nav_area,
          n.target_key,
          n.item_type,
          n.option_type,
          n.display_order,

          n.package_id,
          n.resource_id,

          p.package_key,
          r.resource_key

          FROM navigation_items n

        JOIN tenants t
          ON t.id = $1
        AND t.is_active = true

        LEFT JOIN resources r
          ON r.id = n.resource_id
         AND r.is_active = true

        LEFT JOIN tenant_resources tr
          ON tr.resource_id = n.resource_id
         AND tr.tenant_id = $1
         AND tr.is_enabled = true

        LEFT JOIN packages p
          ON p.id = n.package_id
         AND p.is_active = true

        LEFT JOIN tenant_packages tp
          ON tp.package_id = n.package_id
         AND tp.tenant_id = $1
         AND tp.is_active = true

        WHERE n.is_active = true
        AND (
            n.resource_id IS NULL
            OR r.resource_key <> 'roles_permissions'
            OR t.rbac_enabled = true
          )
          AND
          (
            (
              n.resource_id IS NOT NULL
              AND r.id IS NOT NULL
              AND tr.resource_id IS NOT NULL
              AND n.resource_id = ANY($2::uuid[])
            )

            OR

            (
              n.resource_id IS NULL
              AND n.package_id IS NOT NULL
              AND p.id IS NOT NULL
              AND tp.package_id IS NOT NULL
            )
          )
        ORDER BY
          CASE n.nav_area
            WHEN 'top' THEN 1
            WHEN 'settings' THEN 2
            ELSE 3
          END,
          n.display_order,
          n.label
        `,
        [
          tenantId,
          viewResourceIds
        ]
      );


    const navigation = {};

    for (const row of result.rows) {

      const item = {
        id: row.target_key,
        navKey: row.nav_key,
        label: row.label,
        type: row.item_type || "page",
        optionType:
          row.option_type || null,
        displayOrder:
          row.display_order
      };


      if (!navigation[row.nav_area]) {
        navigation[row.nav_area] = [];
      }

      navigation[row.nav_area].push(item);
    }
    if (!navigation.top) {
      navigation.top = [];
    }

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