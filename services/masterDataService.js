const db = require("../db/appDb");
const masterSchemas = require("../schemas/masterSchemas");

async function create(entity, data, tenantId) {
  const config = masterSchemas[entity];
  if (!config) throw new Error("Invalid entity");

  validateRequired(config, data);

  const columns = config.columns.filter(col => col !== "id" && data[col] !== undefined);
  const values = columns.map(col => data[col]);

  const placeholders = columns.map((_, i) => `$${i + 2}`);

  const query = `
    INSERT INTO ${config.table} (tenant_id, ${columns.join(", ")})
    VALUES ($1, ${placeholders.join(", ")})
    RETURNING *
  `;

  const result = await db.query(query, [tenantId, ...values]);
  return result.rows[0];
}

async function update(entity, id, data, tenantId) {
  const config = masterSchemas[entity];
  if (!config) throw new Error("Invalid entity");

  const columns = config.columns.filter(col => col !== "id" && data[col] !== undefined);
  const values = columns.map(col => data[col]);

  const setClause = columns
    .map((col, i) => `${col} = $${i + 1}`)
    .join(", ");

  const query = `
    UPDATE ${config.table}
    SET ${setClause}
    WHERE id = $${columns.length + 1}
    AND tenant_id = $${columns.length + 2}
    RETURNING *
  `;

  const result = await db.query(query, [...values, id, tenantId]);
  return result.rows[0];
}

async function remove(entity, id, tenantId) {
  const config = masterSchemas[entity];
  if (!config) throw new Error("Invalid entity");
  if (!config.allowDelete) throw new Error("Delete not allowed");

  const query = `
    DELETE FROM ${config.table}
    WHERE id = $1 AND tenant_id = $2
  `;

  await db.query(query, [id, tenantId]);
}

async function list(entity, tenantId) {
  const config = masterSchemas[entity];
  if (!config) throw new Error("Invalid entity");

  const result = await db.query(
    `SELECT * FROM ${config.table}
     WHERE tenant_id = $1
     ORDER BY id`,
    [tenantId]
  );

  return result.rows;
}

function validateRequired(config, data) {
  for (const field of config.required) {
    if (!data[field]) {
      throw new Error(`${field} is required`);
    }
  }
}

module.exports = {
  create,
  update,
  remove,
  list
};