const db = require('../../db/appDb');
const crud = require('../../services/baseCrudService');

const TABLE = "list_dropdowns";

async function getList(tenantId, type) {

  const result = await db.query(
    `SELECT id, dropdown_value, dropdown_code, sort_order
     FROM list_dropdowns
     WHERE tenant_id = $1
     AND dropdown_type = $2
     AND is_active = true
     ORDER BY sort_order`,
    [tenantId, type]
  );

  return result.rows;
}

async function getAll(tenantId) {

  const result = await db.query(
    `SELECT dropdown_type, id, dropdown_value, dropdown_code, sort_order
     FROM list_dropdowns
     WHERE tenant_id = $1
     AND is_active = true
     ORDER BY dropdown_type, sort_order`,
    [tenantId]
  );

  const grouped = {};

  for (const r of result.rows) {

    if (!grouped[r.dropdown_type]) {
      grouped[r.dropdown_type] = [];
    }

    grouped[r.dropdown_type].push({
      id: r.id,
      value: r.dropdown_value,
      code: r.dropdown_code
    });
  }

  return grouped;
}

async function create(tenantId, userId, type, data) {

  const payload = {
    dropdown_type: type,
    dropdown_value: data.dropdown_value,
    dropdown_code: data.dropdown_code,
    sort_order: data.sort_order || 0,
    is_active: true
  };

  return crud.create(TABLE, tenantId, userId, payload);
}

async function update(tenantId, userId, id, data) {

  return crud.update(TABLE, tenantId, userId, id, data);
}

async function softDelete(tenantId, userId, id) {

  return crud.softDelete(TABLE, tenantId, userId, id);
}

module.exports = {
  getList,
  getAll,
  create,
  update,
  softDelete
};