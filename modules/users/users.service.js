const db = require('../../db/authDb');
const crud = require('../../services/baseCrudService');

const TABLE = "users";

// -----------------------------
function mapRow(r) {

  if (!r) return null;

  return {
    id: r.id,
    firstname: r.firstname,
    lastname: r.lastname,
    email: r.email,
    role: r.role,
    is_active: r.is_active
  };
}

// -----------------------------
async function countUsers(tenantId) {

  const result = await db.query(
    `SELECT COUNT(*)::int AS count
     FROM users
     WHERE tenant_id = $1
     AND is_deleted = false`,
    [tenantId]
  );

  return result.rows[0].count;
}

// -----------------------------
async function getUsers(tenantId, search) {

  const term = `%${search || ''}%`;

  const result = await db.query(
    `SELECT *
     FROM users
     WHERE tenant_id = $1
     AND is_deleted = false
     AND (
        firstname ILIKE $2 OR
        lastname ILIKE $2 OR
        email ILIKE $2
     )
     ORDER BY firstname
     LIMIT 100`,
    [tenantId, term]
  );

  return result.rows.map(mapRow);
}

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
async function create(tenantId, userId, data) {

  const payload = {
    firstname: data.firstname,
    lastname: data.lastname,
    email: data.email,
    role: data.role,
    is_active: data.is_active
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
async function update(tenantId, userId, id, data) {

  const payload = {
    firstname: data.firstname,
    lastname: data.lastname,
    email: data.email,
    role: data.role,
    is_active: data.is_active
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
  countUsers,
  getUsers,
  getById,
  create,
  update,
  softDelete
};