const db = require('../../db/appDb');

// -----------------------------
// GET USER ROLES
// -----------------------------
async function getUserRoles(tenantId, userId) {

  const result = await db.query(
    `SELECT role_id
     FROM user_roles
     WHERE tenant_id = $1
     AND user_id = $2
     AND is_active = true`,
    [tenantId, userId]
  );

  return result.rows.map(r => r.role_id);
}

// -----------------------------
// SAVE USER ROLES (REPLACE)
// -----------------------------
async function saveUserRoles(tenantId, currentUserId, userId, roleIds) {

  await db.query('BEGIN');

  await db.query(
    `DELETE FROM user_roles
     WHERE tenant_id = $1
     AND user_id = $2`,
    [tenantId, userId]
  );

  for (const roleId of roleIds) {
    await db.query(
      `INSERT INTO user_roles
       (tenant_id, user_id, role_id, created_by)
       VALUES ($1, $2, $3, $4)`,
      [tenantId, userId, roleId, currentUserId]
    );
  }

  await db.query('COMMIT');
}

module.exports = {
  getUserRoles,
  saveUserRoles
};