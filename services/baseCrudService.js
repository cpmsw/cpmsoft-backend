// -----------------------------
async function getById(db, table, tenantId, id) {

  const result = await db.query(
    `SELECT *
     FROM ${table}
     WHERE id = $1
     AND tenant_id = $2
     AND is_deleted = false`,
    [id, tenantId]
  );

  return result.rows[0];
}

// -----------------------------
async function getAll(db, table, tenantId) {

  const result = await db.query(
    `SELECT *
     FROM ${table}
     WHERE tenant_id = $1
     AND is_deleted = false
     ORDER BY created_at DESC`,
    [tenantId]
  );

  return result.rows;
}

// -----------------------------
async function create(db, table, tenantId, userId, data) {

  const cleaned = {};

  for (const [key, value] of Object.entries(data)) {

    if (value === undefined) continue;

    if (Array.isArray(value)) {
      cleaned[key] = value[0];
    }
    else if (typeof value === "object" && value !== null) {
      cleaned[key] = JSON.stringify(value);
    }
    else {
      cleaned[key] = value;
    }
  }

  const keys = Object.keys(cleaned);
  const values = Object.values(cleaned);

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
async function update(db, table, tenantId, userId, id, data) {

  const cleaned = {};

  for (const [key, value] of Object.entries(data)) {

    if (value === undefined) continue;

    if (Array.isArray(value)) {
      cleaned[key] = value[0];
    }
    else if (typeof value === "object" && value !== null) {
      cleaned[key] = JSON.stringify(value);
    }
    else {
      cleaned[key] = value;
    }
  }

  const keys = Object.keys(cleaned);
  const values = Object.values(cleaned);

  if (keys.length === 0) {
    throw new Error("No fields provided for update");
  }

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
console.log("UPDATE ROW COUNT:", result.rowCount);

  return result.rows[0];
}

// -----------------------------
async function softDelete(db, table, tenantId, userId, id) {

  await db.query(
    `UPDATE ${table}
     SET is_deleted = true,
         deleted_at = now(),
         deleted_by = $2
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