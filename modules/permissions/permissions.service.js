const db = require('../../db/appDb');

// -----------------------------
// LIST GROUPED
// -----------------------------
async function getPermissionsGrouped() {

  const result = await db.query(
    `SELECT id, permission_key, permission_name, module_key
     FROM permissions
     WHERE is_active = true
     ORDER BY module_key, permission_name`
  );

  const grouped = {};

  for (const row of result.rows) {

    if (!grouped[row.module_key]) {
      grouped[row.module_key] = [];
    }

    grouped[row.module_key].push({
      id: row.id,
      key: row.permission_key,
      name: row.permission_name
    });
  }

  return grouped;
}

module.exports = {
  getPermissionsGrouped
};