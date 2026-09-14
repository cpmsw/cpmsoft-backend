const appDb =
  require("cpmsoft-core/common/db/appDb");

const authDb =
  require("cpmsoft-core/common/db/authDb");


// ---------------------------------
// GET ENABLED RESOURCE IDS
// ---------------------------------
async function getEnabledResourceIds(tenantId) {

  const result =
    await authDb.query(
      `SELECT tr.resource_id
       FROM tenant_resources tr
       JOIN resources r
         ON r.id = tr.resource_id
       WHERE tr.tenant_id = $1
         AND tr.is_enabled = true
         AND r.is_active = true`,
      [tenantId]
    );

  return result.rows.map(
    row => row.resource_id
  );
}


// ---------------------------------
// IS PRIMARY CONTACT
// ---------------------------------
async function isPrimaryContact(
  tenantId,
  userId
) {

  const result =
    await authDb.query(
      `SELECT EXISTS (
         SELECT 1
         FROM tenants
         WHERE id = $1
           AND primary_contact_user_id = $2
       ) AS is_primary`,
      [tenantId, userId]
    );

  return (
    result.rows[0]?.is_primary === true
  );
}


// ---------------------------------
// GET USER PERMISSIONS
// ---------------------------------
// ---------------------------------
// GET USER PERMISSIONS
// ---------------------------------
async function getUserPermissions(
  tenantId,
  userId
) {

  // ---------------------------------
  // TENANT ENABLED RESOURCES
  // ---------------------------------

  const resourceResult =
    await authDb.query(
      `SELECT
         tr.resource_id,
         r.resource_key
       FROM tenant_resources tr
       JOIN resources r
         ON r.id = tr.resource_id
       WHERE tr.tenant_id = $1
         AND tr.is_enabled = true
         AND r.is_active = true`,
      [tenantId]
    );


  if (resourceResult.rowCount === 0) {
    return [];
  }


  const resourceIds =
    resourceResult.rows.map(
      row => row.resource_id
    );


  const resourceKeyById =
    new Map(
      resourceResult.rows.map(
        row => [
          String(row.resource_id),
          row.resource_key
        ]
      )
    );


  // ---------------------------------
  // ADMINISTRATOR INVARIANT
  //
  // ADMIN always receives every active
  // permission for every enabled tenant
  // resource.
  // ---------------------------------

  const adminResult =
    await appDb.query(
      `SELECT EXISTS (
         SELECT 1

         FROM user_roles ur

         JOIN roles r
           ON r.id = ur.role_id
          AND r.tenant_id = ur.tenant_id

         WHERE ur.tenant_id = $1
           AND ur.user_id = $2
           AND ur.is_active = true
           AND r.is_active = true
           AND r.role_code = 'ADMIN'
       ) AS is_admin`,
      [
        tenantId,
        userId
      ]
    );


  const isAdministrator =
    adminResult.rows[0]?.is_admin === true;


  if (isAdministrator) {

    const permissionResult =
      await appDb.query(
        `SELECT permission_key
         FROM permissions
         WHERE is_active = true
         ORDER BY permission_key`
      );


    const permissions = [];


    for (const resource of resourceResult.rows) {

      for (const permission of permissionResult.rows) {

        permissions.push(
          `${resource.resource_key}.${permission.permission_key}`
        );
      }
    }


    return permissions;
  }


  // ---------------------------------
  // STANDARD ROLE-BASED PERMISSIONS
  // ---------------------------------

  const result =
    await appDb.query(
      `SELECT DISTINCT
         rp.resource_id,
         p.permission_key

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
         AND rp.resource_id =
             ANY($3::uuid[])

       ORDER BY
         rp.resource_id,
         p.permission_key`,
      [
        tenantId,
        userId,
        resourceIds
      ]
    );


  return result.rows
    .map(row => {

      const resourceKey =
        resourceKeyById.get(
          String(row.resource_id)
        );


      if (!resourceKey) {
        return null;
      }


      return (
        `${resourceKey}.${row.permission_key}`
      );
    })
    .filter(Boolean);
}
// ---------------------------------
// CHECK ONE PERMISSION
// ---------------------------------
async function hasPermission(
  tenantId,
  userId,
  permissionKey
) {

  const permissions =
    await getUserPermissions(
      tenantId,
      userId
    );

  return permissions.includes(
    permissionKey
  );
}


module.exports = {
  getEnabledResourceIds,
  isPrimaryContact,
  getUserPermissions,
  hasPermission
};