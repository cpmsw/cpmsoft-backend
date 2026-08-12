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
async function getUserPermissions(
  tenantId,
  userId
) {

  const resourceIds =
    await getEnabledResourceIds(
      tenantId
    );

  const primary =
    await isPrimaryContact(
      tenantId,
      userId
    );


  // ---------------------------------
  // PRIMARY CONTACT
  // ---------------------------------
  if (primary) {

    const result =
      await appDb.query(
        `SELECT DISTINCT
            p.permission_key

         FROM permissions p

         WHERE p.is_active = true

           AND (
             p.resource_id IS NULL
             OR
             p.resource_id =
               ANY($1::uuid[])
           )

         ORDER BY p.permission_key`,
        [resourceIds]
      );

    return result.rows.map(
      row => row.permission_key
    );
  }


  // ---------------------------------
  // NORMAL TENANT USER
  // ---------------------------------
  const result =
    await appDb.query(
      `SELECT DISTINCT
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

         AND (
           p.resource_id IS NULL
           OR
           p.resource_id =
             ANY($3::uuid[])
         )

       ORDER BY p.permission_key`,
      [
        tenantId,
        userId,
        resourceIds
      ]
    );

  return result.rows.map(
    row => row.permission_key
  );
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