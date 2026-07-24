
const db = require('../../db/authDb');
const crud = require('../../services/baseCrudService');
const { sendEmail } = require('../../services/emailService');
const bcrypt = require("bcrypt");


const TABLE = "users";

const ACTIVATION_URL = "https://cpmsoft.app/activate";

function buildActivationEmail({
  firstName,
  code,
  twofaRequired
}) {
  const greeting = firstName
    ? `Hello ${firstName},`
    : "Hello,";

  const twofaText = twofaRequired
    ? `
After activating your account, CPMSOFT will ask you to set up two-factor authentication.

Before signing in, please install Google Authenticator on your phone:

iPhone or iPad:
https://apps.apple.com/app/google-authenticator/id388497605

Android:
https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2
`
    : "";

  const twofaHtml = twofaRequired
    ? `
      <div style="
        margin-top:24px;
        padding:16px;
        background:#f4f6f8;
        border:1px solid #d8dde3;
        border-radius:6px;
      ">
        <h3 style="margin-top:0;">
          Two-Factor Authentication
        </h3>

        <p>
          After activating your account, CPMSOFT will ask you
          to set up two-factor authentication.
        </p>

        <p>
          Please install <strong>Google Authenticator</strong>
          on your phone before signing in:
        </p>

        <p>
          <a href="https://apps.apple.com/app/google-authenticator/id388497605">
            Download for iPhone or iPad
          </a>
        </p>

        <p>
          <a href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2">
            Download for Android
          </a>
        </p>

        <p style="margin-bottom:0;">
          During your first sign-in, CPMSOFT will display a QR
          code. Scan that QR code using Google Authenticator,
          then enter the six-digit code shown in the app.
        </p>
      </div>
    `
    : "";

  return {
    subject: "Welcome to CPMSOFT – Activate Your Account",

    text: `
${greeting}

Your CPMSOFT account has been created.

Activation code:

${code}

Activate your account here:

${ACTIVATION_URL}

This activation code expires in 15 minutes.
${twofaText}
If you were not expecting this invitation, you may safely ignore this email.
`.trim(),

    html: `
      <div style="
        max-width:600px;
        font-family:Arial,sans-serif;
        font-size:15px;
        line-height:1.6;
        color:#222;
      ">
        <p>${greeting}</p>

        <p>Your CPMSOFT account has been created.</p>

        <p><strong>Your activation code is:</strong></p>

        <div style="
          display:inline-block;
          padding:12px 20px;
          margin:5px 0 15px;
          font-size:28px;
          font-weight:bold;
          letter-spacing:5px;
          background:#f4f6f8;
          border:1px solid #d8dde3;
          border-radius:6px;
        ">
          ${code}
        </div>

        <p>
          This activation code expires in
          <strong>15 minutes</strong>.
        </p>

        <p>
          <a
            href="${ACTIVATION_URL}"
            style="
              display:inline-block;
              padding:11px 18px;
              background:#1769aa;
              color:#fff;
              text-decoration:none;
              border-radius:5px;
              font-weight:bold;
            "
          >
            Activate Your Account
          </a>
        </p>

        <p>
          You may also copy and paste this address into your browser:
        </p>

        <p>
          <a href="${ACTIVATION_URL}">
            ${ACTIVATION_URL}
          </a>
        </p>

        ${twofaHtml}

        <hr style="
          margin-top:25px;
          border:0;
          border-top:1px solid #ddd;
        ">

        <p style="font-size:13px;color:#666;">
          If you were not expecting this invitation, you may
          safely ignore this email.
        </p>
      </div>
    `
  };
}

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
      const activationEmail = buildActivationEmail({
        firstName: data.first_name,
        code,
        twofaRequired: data.twofa_required ?? true
      });

      await sendEmail({
        to: email,
        ...activationEmail
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


async function resendInvite(tenantId, targetUserId) {

  const code = Math.floor(100000 + Math.random() * 900000).toString();

  const expires = new Date();
  expires.setMinutes(expires.getMinutes() + 15);

  const result = await db.query(
    `UPDATE users
     SET verification_code = $1,
         verification_expires = $2
     WHERE id = $3 AND tenant_id = $4
     RETURNING email, first_name, twofa_required`,
    [code, expires, targetUserId, tenantId]
  );

  if (!result.rowCount) {
    throw new Error("User not found");
  }

  const user = result.rows[0];

  const activationEmail = buildActivationEmail({
    firstName: user.first_name,
    code,
    twofaRequired: user.twofa_required === true
  });

  await sendEmail({
    to: user.email,
    ...activationEmail
  });

  return {
    success: true,
    email: user.email,
    message: "Activation code sent successfully"
  };
}


async function inviteUser(tenantId, adminId, data) {

  if (!data?.email || !data?.first_name || !data?.last_name) {
    throw new Error("Missing required fields");
  }

  const code = Math.floor(
    100000 + Math.random() * 900000
  ).toString();

  const expires = new Date(
    Date.now() + 15 * 60 * 1000
  );

  const email = data.email.trim().toLowerCase();
  const twofaRequired = data.twofa_required ?? true;

  try {
    await db.query(
      `INSERT INTO users
       (
         tenant_id,
         email,
         first_name,
         last_name,
         role,
         password_hash,
         is_active,
         is_verified,
         verification_code,
         verification_expires,
         twofa_required,
         created_by
       )
       VALUES (
         $1, $2, $3, $4, $5,
         NULL, true, false,
         $6, $7, $8, $9
       )`,
      [
        tenantId,
        email,
        data.first_name,
        data.last_name,
        data.role || "user",
        code,
        expires,
        twofaRequired,
        adminId
      ]
    );

    const activationEmail = buildActivationEmail({
      firstName: data.first_name,
      code,
      twofaRequired
    });

    await sendEmail({
      to: email,
      ...activationEmail
    });

    return {
      success: true,
      email,
      message: "Invitation sent successfully"
    };

  } catch (err) {

    if (err.code === "23505") {
      const error = new Error(
        "A user with this email already exists."
      );
      error.statusCode = 400;
      throw error;
    }

    throw err;
  }
}

async function activateUser(email, code, password) {

  const emailNormalized = email.toLowerCase().trim();

  console.log("ACTIVATE EMAIL:", emailNormalized);
  console.log("ACTIVATE CODE RECEIVED:", code);

  const result = await db.query(
    `SELECT id, verification_code, verification_expires
     FROM users
     WHERE email = $1`,
    [emailNormalized]
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
  inviteUser,
  activateUser
};