const db = require('../../db/appDb');

// -----------------------------
// GET ROLE PERMISSIONS
// -----------------------------
async function getRolePermissions(tenantId, roleId) {

  const result = await db.query(
    `SELECT permission_id
     FROM role_permissions
     WHERE tenant_id = $1
     AND role_id = $2`,
    [tenantId, roleId]
  );

  return result.rows.map(r => r.permission_id);
}

// -----------------------------
// SAVE ROLE PERMISSIONS (REPLACE)
// -----------------------------
async function saveRolePermissions(tenantId, userId, roleId, permissionIds) {

  await db.query('BEGIN');

  await db.query(
    `DELETE FROM role_permissions
     WHERE tenant_id = $1
     AND role_id = $2`,
    [tenantId, roleId]
  );

  for (const pid of permissionIds) {
    await db.query(
      `INSERT INTO role_permissions
       (tenant_id, role_id, permission_id, created_by)
       VALUES ($1, $2, $3, $4)`,
      [tenantId, roleId, pid, userId]
    );
  }

  await db.query('COMMIT');
}

module.exports = {
  getRolePermissions,
  saveRolePermissions
};