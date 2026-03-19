const db = require('../../db/authDb');
const crud = require('../../services/baseCrudService');
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const TABLE = "users";

// -----------------------------
function mapRow(r) {

  if (!r) return null;

  return {
    id: r.id,
    first_name: r.first_name,
    last_name: r.last_name,
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
     AND is_active = true`,
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
     AND is_active = true
     AND (
        first_name ILIKE $2 OR
        last_name ILIKE $2 OR
        email ILIKE $2
     )
     ORDER BY first_name
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

  if (!data) {
    throw new Error("Request body missing");
  }
  if (!data.password) {
    throw new Error("Password is required");
  }
  if (!data.first_name || !data.last_name || !data.email) {
    throw new Error("Missing required fields");
  }
  const password_hash = await bcrypt.hash(data.password, 10);
  const payload = {
    first_name: data.first_name,
    last_name: data.last_name,
    email: data.email,
    password_hash,
    role: data.role ?? "user",
    is_active: data.is_active ?? true
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
    first_name: data.first_name,
    last_name: data.last_name,
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
async function softDelete(tenantId, adminId, userId) {

  // Protect tenant owner
  const tenant = await db.query(
    `SELECT owner_user_id
     FROM tenants
     WHERE id = $1`,
    [tenantId]
  );

  if (tenant.rows[0]?.owner_user_id === userId) {
    throw new Error("Tenant owner cannot be deactivated");
  }

  // Deactivate user instead of deleting
  await db.query(
    `UPDATE users
     SET is_active = false,
         deactivated_at = now(),
         deactivated_by = $2
     WHERE id = $3
     AND tenant_id = $1`,
    [tenantId, adminId, userId]
  );

  return { success: true };
}


async function inviteUser(tenantId, adminId, data) {

  const code = Math.floor(100000 + Math.random() * 900000).toString();

  const expires = new Date(Date.now() + 15 * 60 * 1000);

  const email = data.email.toLowerCase().trim();

  await db.query(
    `INSERT INTO users
     (tenant_id,email,first_name,last_name,role,
      password_hash,is_verified,
      verification_code,verification_expires,
      created_by)
     VALUES ($1,$2,$3,$4,$5,
             NULL,false,
             $6,$7,$8)`,
    [
      tenantId,
      email,
      data.first_name,
      data.last_name,
      data.role || 'user',
      code,
      expires,
      adminId
    ]
  );

  // TODO: send email later
  console.log("INVITE CODE:", code);

  return { success: true };
}


async function activateUser(email, code, password) {

  const emailNormalized = email.toLowerCase().trim();

  console.log("ACTIVATE EMAIL:", emailNormalized);
  console.log("ACTIVATE CODE RECEIVED:", code);

  const result = await db.query(
    `SELECT id, verification_code, verification_expires
     FROM users
     WHERE email = $1`,
    [email.toLowerCase()]
  );

  if (!result.rowCount) {
    throw new Error("User not found");
  }

  const user = result.rows[0];

  if (user.verification_code !== code) {
    throw new Error("Invalid verification code");
  }

  if (new Date(user.verification_expires) < new Date()) {
    throw new Error("Verification code expired");
  }

  const password_hash = await bcrypt.hash(password, 10);

  await db.query(
    `UPDATE users
     SET password_hash = $1,
         is_verified = true,
         verified_at = now(),
         verification_code = NULL,
         verification_expires = NULL
     WHERE id = $2`,
    [password_hash, user.id]
  );

  return { success: true };
}
module.exports = {
  countUsers,
  getUsers,
  getById,
  create,
  update,
  softDelete,
  inviteUser,
  activateUser
};