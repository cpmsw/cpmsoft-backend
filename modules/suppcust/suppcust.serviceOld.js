const db = require('../../db/appDb');
const crud = require('../../services/baseCrudService');

const TABLE = "suppcust";

function mapRow(r) {
  return {
    id: r.id,
    suppcustCode:r.suppcust_code,
    name: r.name,
    email: r.email,
    phone: r.phone,
    city: r.city,
    state: r.state,
    isCustomer: r.is_customer,
    isSupplier: r.is_supplier
  };
}

async function countSuppcust(tenantId, column) {

  const allowed = ["is_customer", "is_supplier"];

  if (!allowed.includes(column)) {
    throw new Error("Invalid column name");
  }

  const result = await db.query(
    `SELECT COUNT(*)::int AS count
     FROM suppcust
     WHERE tenant_id = $1
     AND ${column} = true
     AND is_deleted = false`,
    [tenantId]
  );

  return result.rows[0].count;
}

// -----------------------------
async function searchByType(tenantId, search, column) {

  const term = `%${search || ''}%`;

  const result = await db.query(
    `SELECT *
     FROM suppcust
     WHERE tenant_id = $1
     AND ${column} = true
     AND is_deleted = false
     AND (
        name ILIKE $2 OR
        email ILIKE $2 OR
        phone ILIKE $2
     )
     ORDER BY name
     LIMIT 100`,
    [tenantId, term]
  );

  return result.rows.map(mapRow);
}

// -----------------------------
async function getCustomers(tenantId, search) {
  return searchByType(tenantId, search, 'is_customer');
}

// -----------------------------
async function getSuppliers(tenantId, search) {
  return searchByType(tenantId, search, 'is_supplier');
}

// -----------------------------
async function getById(tenantId, id) {
  const row = await crud.getById(TABLE, tenantId, id);
  return mapRow(row);
}

// -----------------------------
async function create(tenantId, userId, data) {
  const row = await crud.create(TABLE, tenantId, userId, data);
  return mapRow(row);
}

// -----------------------------
async function update(tenantId, userId, id, data) {
  const row = await crud.update(TABLE, tenantId, userId, id, data);
  return mapRow(row);
}

// -----------------------------
async function softDelete(tenantId, userId, id) {
  return crud.softDelete(TABLE, tenantId, userId, id);
}

module.exports = {
  countSuppcust,
  getCustomers,
  getSuppliers,
  getById,
  create,
  update,
  softDelete
};