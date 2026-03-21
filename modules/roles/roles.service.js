const db = require('../../db/appDb');
const crud = require('../../services/baseCrudService');

const TABLE = "roles";

// -----------------------------
// MAP
// -----------------------------
function mapRow(r) {
  if (!r) return null;

  return {
    id: r.id,
    roleCode: r.role_code,
    roleName: r.role_name,
    description: r.description,
    isActive: r.is_active
  };
}

// -----------------------------
// LIST
// -----------------------------
async function getRoles(tenantId, search) {

  const term = `%${search || ''}%`;

  const result = await db.query(
    `SELECT *
     FROM roles
     WHERE tenant_id = $1
     AND (
        role_name ILIKE $2 OR
        role_code ILIKE $2
     )
     ORDER BY role_name`,
    [tenantId, term]
  );

  return result.rows.map(mapRow);
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
// CREATE
// -----------------------------
async function createRole(tenantId, userId, data) {

  const payload = {
    role_code: data.roleCode,
    role_name: data.roleName,
    description: data.description,
    is_system: false
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
async function updateRole(tenantId, userId, id, data) {

  const payload = {
    role_name: data.roleName,
    description: data.description
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
// DELETE (SOFT)
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
  getRoles,
  getById,
  createRole,
  updateRole,
  softDelete
};