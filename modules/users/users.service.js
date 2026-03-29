const { deprecate } = require('util');
const db = require('../../db/authDb');
const crud = require('../../services/baseCrudService');
const { sendEmail } = require('../../services/emailService');
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
    phone: r.phone,
    job_title: r.job_title,
    department: r.department,
    role: r.role,
    is_active: r.is_active,
    twofa_required: r.twofa_required
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
        LOWER(email) ILIKE LOWER($2)
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

  if (!data.first_name || !data.last_name || !data.email) {
    throw new Error("Missing required fields");
  }

  const email = data.email.trim().toLowerCase();

  // 🔐 If password provided → direct create
  const hasPassword = !!data.password;

  const password_hash = hasPassword
    ? await bcrypt.hash(data.password, 10)
    : null;

  // 🔑 Generate activation only if no password
  const code = !hasPassword
    ? Math.floor(100000 + Math.random() * 900000).toString()
    : null;

  const expires = !hasPassword
    ? new Date(Date.now() + 15 * 60 * 1000)
    : null;

  const payload = {
    id: data.id,
    first_name: data.first_name,
    last_name: data.last_name,
    email,
    phone: data.phone,
    job_title: data.job_title,
    department: data.department,
    password_hash,
    is_active: data.is_active ?? true,
    is_verified: hasPassword, // ✅ verified only if password exists
    verification_code: code,
    verification_expires: expires,
    twofa_required: data.twofa_required ?? true
  };

  try {

    const row = await crud.create(
      db,
      TABLE,
      tenantId,
      userId,
      payload
    );

    // 📧 Send invite email ONLY if no password
    if (!hasPassword) {

      await sendEmail({
        to: email,
        subject: 'CPMSOFT Account Activation',
        text: `Your activation code is: ${code}. This code expires in 15 minutes.`,
        html: `
          <p>You’ve been invited to CPMSOFT.</p>
          <p>Your activation code is:</p>
          <h2>${code}</h2>
          <p>This code expires in 15 minutes.</p>
        `
      });
    }

    return mapRow(row);

  } catch (err) {

    if (
      err.code === '23505' &&
      err.constraint === 'cpmsoft_user_email_key'
    ) {
      const error = new Error("A user with this email already exists.");
      error.statusCode = 400;
      throw error;
    }

    throw err;
  }
}

// -----------------------------
async function update(tenantId, userId, id, data) {

  const payload = {
    first_name: data.first_name,
    last_name: data.last_name,
    email: data.email?.trim().toLowerCase(),
    phone: data.phone,
    job_title: data.job_title,
    department: data.department,
    role: data.role,
    is_active: data.is_active,
    twofa_required: data.twofa_required
  };

  try {
    const row = await crud.update(
      db,
      TABLE,
      tenantId,
      userId,
      id,
      payload
    );

    return mapRow(row);

  } catch (err) {

    if (
      err.code === '23505' &&
      err.constraint === 'cpmsoft_user_email_key'
    ) {
      const error = new Error("A user with this email already exists.");
      error.statusCode = 400;
      throw error;
    }

    throw err;
  }
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


async function resendInvite(tenantId, userId) {

  const code = Math.floor(100000 + Math.random() * 900000).toString();

  const expires = new Date();
  expires.setMinutes(expires.getMinutes() + 15);

  const result = await db.query(
    `UPDATE users
     SET verification_code = $1,
         verification_expires = $2
     WHERE id = $3 AND tenant_id = $4
     RETURNING email, first_name`,
    [code, expires, userId, tenantId]
  );

  if (!result.rowCount) {
    throw new Error("User not found");
  }

  const user = result.rows[0];

  await sendEmail({
    to: user.email,
    subject: 'CPMSOFT Account Activation',
    text: `Your activation code is: ${code}. This code expires in 15 minutes.`,
    html: `
      <p>Your activation code is:</p>
      <h2>${code}</h2>
      <p>This code expires in 15 minutes.</p>
    `
  });

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

  if (user.verification_code !== code.trim()) {
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
  resendInvite,
  activateUser
};