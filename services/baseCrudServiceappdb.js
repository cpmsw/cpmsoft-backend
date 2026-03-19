const db = require('../db/appDb');

// -----------------------------
async function getById(table, tenantId, id) {

  const result = await db.query(
    `SELECT *
     FROM ${table}
     WHERE id = $1
     AND tenant_id = $2
     AND is_active = true`,
    [id, tenantId]
  );

  return result.rows[0];
}

// -----------------------------
async function getAll(table, tenantId) {

  const result = await db.query(
    `SELECT *
     FROM ${table}
     WHERE tenant_id = $1
     AND is_active = true
     ORDER BY created_at DESC`,
    [tenantId]
  );

  return result.rows;
}

// -----------------------------
async function create(table, tenantId, userId, data) {

  const keys = Object.keys(data);
  const values = Object.values(data);

  const columns = keys.join(',');
  const params = keys.map((_, i) => `$${i + 3}`).join(',');

  const result = await db.query(
    `INSERT INTO ${table}
     (tenant_id, ${columns}, created_by)
     VALUES ($1, ${params}, $2)
     RETURNING *`,
    [tenantId, userId, ...values]
  );

  return result.rows[0];
}

// -----------------------------
async function update(table, tenantId, userId, id, data) {

  const keys = Object.keys(data);
  const values = Object.values(data);

  const setClause = keys
    .map((k, i) => `${k} = $${i + 4}`)
    .join(',');

  const result = await db.query(
    `UPDATE ${table}
     SET ${setClause},
         updated_by = $2,
         updated_at = now()
     WHERE id = $3
     AND tenant_id = $1
     RETURNING *`,
    [tenantId, userId, id, ...values]
  );

  return result.rows[0];
}

// -----------------------------
async function softDelete(table, tenantId, userId, id) {

  await db.query(
    `UPDATE ${table}
     SET is_active = false,
         deactivated_at = now(),
         deactivated_by = $2
     WHERE id = $3
     AND tenant_id = $1`,
    [tenantId, userId, id]
  );

  return { success: true };
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  softDelete
};