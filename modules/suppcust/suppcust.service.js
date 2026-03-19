const db = require('../../db/appDb');
const crud = require('../../services/baseCrudService');

const TABLE = "suppcust";

function mapRow(r) {
  if (!r) return null;

  return {
    id: r.id,
    suppcustCode: r.suppcust_code,
    name: r.name,
    email: r.email,
    phone: r.phone,
    city: r.city,
    state: r.state,
    isCustomer: r.is_customer,
    isSupplier: r.is_supplier
  };
}

// -----------------------------
// COUNT
// -----------------------------
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
     AND is_active = true`,
    [tenantId]
  );

  return result.rows[0].count;
}

// -----------------------------
// SEARCH
// -----------------------------
async function searchByType(tenantId, search, column) {

  const term = `%${search || ''}%`;

  const result = await db.query(
    `SELECT *
     FROM suppcust
     WHERE tenant_id = $1
     AND ${column} = true
     AND is_active = true
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
// LIST CUSTOMERS
// -----------------------------
async function getCustomers(tenantId, search) {
  return searchByType(tenantId, search, "is_customer");
}

// -----------------------------
// LIST SUPPLIERS
// -----------------------------
async function getSuppliers(tenantId, search) {
  return searchByType(tenantId, search, "is_supplier");
}

// -----------------------------
// GET ONE
// -----------------------------
async function getById(tenantId, id) {

  const row = await crud.getById(
    db,
    TABLE,
    tenantId,
    id
  );

  return mapRow(row);
}

// -----------------------------
// CREATE CUSTOMER
// -----------------------------
async function createCustomer(tenantId, userId, data) {

  const payload = {
    suppcust_code: data.suppcustCode,
    name: data.name,
    email: data.email,
    phone: data.phone,
    city: data.city,
    state: data.state,
    is_customer: true,
    is_supplier: false
  };

  const row = await crud.create(
    db,
    TABLE,
    tenantId,
    userId,
    payload
  );

  return mapRow(row);
}

// -----------------------------
// CREATE SUPPLIER
// -----------------------------
async function createSupplier(tenantId, userId, data) {

  const payload = {
    suppcust_code: data.suppcustCode,
    name: data.name,
    email: data.email,
    phone: data.phone,
    city: data.city,
    state: data.state,
    is_customer: false,
    is_supplier: true
  };

  const row = await crud.create(
    db,
    TABLE,
    tenantId,
    userId,
    payload
  );

  return mapRow(row);
}

// -----------------------------
// UPDATE
// -----------------------------
async function update(tenantId, userId, id, data) {

  const payload = {
    suppcust_code: data.suppcustCode,
    name: data.name,
    email: data.email,
    phone: data.phone,
    city: data.city,
    state: data.state
  };

  const row = await crud.update(
    db,
    TABLE,
    tenantId,
    userId,
    id,
    payload
  );

  return mapRow(row);
}

// -----------------------------
// DELETE
// -----------------------------
async function softDelete(tenantId, userId, id) {

  return crud.softDelete(
    db,
    TABLE,
    tenantId,
    userId,
    id
  );
}

module.exports = {
  countSuppcust,
  getCustomers,
  getSuppliers,
  getById,
  createCustomer,
  createSupplier,
  update,
  softDelete
};