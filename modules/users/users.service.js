
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
    display_name: r.display_name,
    email: r.email,
    phone: r.phone,
    job_title: r.job_title,
    department: r.department,

    is_active: r.is_active,
    is_verified: r.is_verified,
    verified_at: r.verified_at,

    twofa_required: r.twofa_required,
    twofa_enabled: r.twofa_enabled,

    created_at: r.created_at,
    updated_at: r.updated_at,
    last_login_at: r.last_login_at,
    deactivated_at: r.deactivated_at
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

async function findActiveUserByEmail(
  email,
  excludeUserId = null
) {
  const values = [email];
  let excludeClause = "";

  if (excludeUserId) {
    values.push(excludeUserId);
    excludeClause = "AND id <> $2";
  }

  const result = await db.query(
    `SELECT
       id,
       tenant_id,
       email,
       is_active,
       is_verified,
       first_name,
       last_name
     FROM users
     WHERE LOWER(email) = LOWER($1)
       AND is_active = true
       ${excludeClause}
     ORDER BY created_at ASC
     LIMIT 1`,
    values
  );

  return result.rows[0] || null;
}

async function findUserInTenantByEmail(tenantId, email) {
  const result = await db.query(
    `SELECT
       id,
       tenant_id,
       email,
       is_active,
       is_verified
     FROM users
     WHERE tenant_id = $1
       AND LOWER(email) = LOWER($2)
     ORDER BY created_at ASC
     LIMIT 1`,
    [tenantId, email]
  );

  return result.rows[0] || null;
}

function createActiveEmailError() {
  const error = new Error(
    "This email address is already associated with an active account. " +
    "Please contact support if you believe this is an error."
  );

  error.statusCode = 409;
  error.code = "EMAIL_ACTIVE_IN_ANOTHER_TENANT";

  return error;
}

async function checkEmailExists(
  tenantId,
  email,
  excludeUserId = null
) {
  const normalizedEmail = String(email || "")
    .trim()
    .toLowerCase();

  if (!normalizedEmail) {
    return {
      exists: false,
      isActive: false,
      isDeactivated: false
    };
  }

  const activeUser = await findActiveUserByEmail(
    normalizedEmail,
    excludeUserId
  );

  if (activeUser) {
    const sameTenant =
      activeUser.tenant_id === tenantId;

    if (sameTenant) {
      return {
        exists: true,
        isActive: true,
        isDeactivated: false,
        sameTenant: true,
        otherTenant: false,
        userId: activeUser.id,
        code: "USER_ALREADY_EXISTS"
      };
    }

    return {
      exists: true,
      isActive: true,
      isDeactivated: false,
      sameTenant: false,
      otherTenant: true,
      code: "EMAIL_ACTIVE_IN_ANOTHER_TENANT"
    };
  }

  const tenantUser =
    await findUserInTenantByEmail(
      tenantId,
      normalizedEmail
    );

  if (
    tenantUser &&
    tenantUser.is_active === false &&
    tenantUser.id !== excludeUserId
  ) {
    return {
      exists: true,
      isActive: false,
      isDeactivated: true,
      sameTenant: true,
      otherTenant: false,
      userId: tenantUser.id,
      isVerified:
        tenantUser.is_verified === true,
      code: "USER_DEACTIVATED"
    };
  }

  return {
    exists: false,
    isActive: false,
    isDeactivated: false,
    sameTenant: false,
    otherTenant: false
  };
}

// -----------------------------
async function create(tenantId, userId, data) {
  if (!data) {
    const error = new Error("Request body missing.");
    error.statusCode = 400;
    error.code = "REQUEST_BODY_MISSING";
    throw error;
  }

  if (!data.first_name || !data.last_name || !data.email) {
    const error = new Error(
      "First name, last name, and email are required."
    );
    error.statusCode = 400;
    error.code = "MISSING_REQUIRED_FIELDS";
    throw error;
  }

  const email = data.email.trim().toLowerCase();

  /*
   * First check for an active account globally.
   * Only one active account is allowed for an email,
   * regardless of tenant.
   */
  const activeUser = await findActiveUserByEmail(email);

  if (activeUser) {
    if (activeUser.tenant_id === tenantId) {
      const error = new Error(
        "A user with this email is already active in this company."
      );

      error.statusCode = 409;
      error.code = "USER_ALREADY_EXISTS";
      error.userId = activeUser.id;
      error.isVerified = activeUser.is_verified === true;

      throw error;
    }

    throw createActiveEmailError();
  }

  /*
   * No active account exists globally.
   * Check whether this tenant already has an inactive historical user.
   */
  const tenantUser = await findUserInTenantByEmail(
    tenantId,
    email
  );

  if (tenantUser && tenantUser.is_active === false) {
    const error = new Error(
      "This user already exists in this company and is currently deactivated."
    );

    error.statusCode = 409;
    error.code = "USER_DEACTIVATED";
    error.userId = tenantUser.id;
    error.isVerified = tenantUser.is_verified === true;

    throw error;
  }

  const hasPassword =
    typeof data.password === "string" &&
    data.password.trim().length > 0;

  const password_hash = hasPassword
    ? await bcrypt.hash(data.password, 10)
    : null;

  const code = !hasPassword
    ? Math.floor(
      100000 + Math.random() * 900000
    ).toString()
    : null;

  const expires = !hasPassword
    ? new Date(Date.now() + 15 * 60 * 1000)
    : null;

  const payload = {
    id: data.id,
    first_name: data.first_name.trim(),
    last_name: data.last_name.trim(),
    email,
    phone: data.phone,
    job_title: data.job_title,
    department: data.department,
    password_hash,
    is_active: data.is_active ?? true,
    is_verified: hasPassword,
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

    if (!hasPassword) {
      const activationEmail = buildActivationEmail({
        firstName: data.first_name,
        code,
        twofaRequired:
          data.twofa_required ?? true
      });

      await sendEmail({
        to: email,
        ...activationEmail
      });
    }

    return mapRow(row);
  } catch (err) {
    /*
     * This catches a race condition where two administrators
     * try to add the same email at nearly the same time.
     */
    if (
      err.code === "23505" &&
      err.constraint === "cpmsoft_user_email_key"
    ) {
      const conflictingUser =
        await findActiveUserByEmail(email);

      if (conflictingUser) {
        if (conflictingUser.tenant_id === tenantId) {
          const error = new Error(
            "A user with this email is already active in this company."
          );

          error.statusCode = 409;
          error.code = "USER_ALREADY_EXISTS";
          error.userId = conflictingUser.id;

          throw error;
        }

        throw createActiveEmailError();
      }

      const error = new Error(
        "This email address is already associated with an active account."
      );

      error.statusCode = 409;
      error.code =
        "EMAIL_ACTIVE_IN_ANOTHER_TENANT";

      throw error;
    }

    throw err;
  }
}

// -----------------------------
async function update(
  tenantId,
  adminUserId,
  id,
  data
) {
  if (!id) {
    const error = new Error(
      "User ID is required."
    );

    error.statusCode = 400;
    error.code = "USER_ID_REQUIRED";

    throw error;
  }

  if (!data) {
    const error = new Error(
      "Request body missing."
    );

    error.statusCode = 400;
    error.code = "REQUEST_BODY_MISSING";

    throw error;
  }

  const existingResult = await db.query(
    `SELECT
       id,
       tenant_id,
       email,
       is_active
     FROM users
     WHERE id = $1
       AND tenant_id = $2
     LIMIT 1`,
    [id, tenantId]
  );

  if (!existingResult.rowCount) {
    const error = new Error(
      "User not found."
    );

    error.statusCode = 404;
    error.code = "USER_NOT_FOUND";

    throw error;
  }

  const email = String(data.email || "")
    .trim()
    .toLowerCase();

  if (!email) {
    const error = new Error(
      "Email is required."
    );

    error.statusCode = 400;
    error.code = "EMAIL_REQUIRED";

    throw error;
  }

  /*
   * Prevent this user from being changed to an email
   * that belongs to another active account.
   */
  const activeUser =
    await findActiveUserByEmail(email, id);

  if (activeUser) {
    if (activeUser.tenant_id === tenantId) {
      const error = new Error(
        "Another active user in this company already uses this email address."
      );

      error.statusCode = 409;
      error.code = "USER_ALREADY_EXISTS";
      error.userId = activeUser.id;
      error.isVerified =
        activeUser.is_verified === true;

      throw error;
    }

    throw createActiveEmailError();
  }

  const payload = {
    first_name:
      data.first_name?.trim() || null,

    last_name:
      data.last_name?.trim() || null,

    display_name:
      data.display_name?.trim() || null,

    email,

    phone:
      data.phone?.trim() || null,

    job_title:
      data.job_title?.trim() || null,

    department:
      data.department?.trim() || null,

    is_active:
      data.is_active,

    twofa_required:
      data.twofa_required
  };

  /*
   * Remove undefined properties so the CRUD service
   * does not overwrite existing values unintentionally.
   */
  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined) {
      delete payload[key];
    }
  });

  try {
    const row = await crud.update(
      db,
      TABLE,
      tenantId,
      adminUserId,
      id,
      payload
    );

    return mapRow(row);
  } catch (err) {
    if (
      err.code === "23505" &&
      err.constraint ===
      "cpmsoft_user_email_key"
    ) {
      const conflictingUser =
        await findActiveUserByEmail(
          email,
          id
        );

      if (conflictingUser) {
        if (
          conflictingUser.tenant_id ===
          tenantId
        ) {
          const error = new Error(
            "Another active user in this company already uses this email address."
          );

          error.statusCode = 409;
          error.code =
            "USER_ALREADY_EXISTS";
          error.userId =
            conflictingUser.id;

          throw error;
        }

        throw createActiveEmailError();
      }

      const error = new Error(
        "This email address is already associated with another active account."
      );

      error.statusCode = 409;
      error.code =
        "EMAIL_ACTIVE_IN_ANOTHER_TENANT";

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
       verification_expires = $2,
       updated_at = now()
   WHERE id = $3
     AND tenant_id = $4
     AND is_active = true
     AND is_verified = false
   RETURNING
     email,
     first_name,
     twofa_required`,
    [
      code,
      expires,
      targetUserId,
      tenantId
    ]
  );
  if (!result.rowCount) {
    const error = new Error(
      "The user was not found, is inactive, or has already activated the account."
    );

    error.statusCode = 400;
    error.code =
      "INVITATION_NOT_AVAILABLE";

    throw error;
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

async function inviteUser(
  tenantId,
  adminId,
  data
) {
  if (
    !data?.email ||
    !data?.first_name ||
    !data?.last_name
  ) {
    const error = new Error(
      "First name, last name, and email are required."
    );

    error.statusCode = 400;
    error.code = "MISSING_REQUIRED_FIELDS";

    throw error;
  }

  const email = data.email
    .trim()
    .toLowerCase();

  /*
   * Only one active account is permitted for an
   * email across all tenants.
   */
  const activeUser =
    await findActiveUserByEmail(email);

  if (activeUser) {
    if (activeUser.tenant_id === tenantId) {
      const error = new Error(
        "A user with this email is already active in this company."
      );

      error.statusCode = 409;
      error.code = "USER_ALREADY_EXISTS";
      error.userId = activeUser.id;
      error.isVerified =
        activeUser.is_verified === true;

      throw error;
    }

    throw createActiveEmailError();
  }

  /*
   * Check whether an inactive copy already exists
   * inside the current tenant.
   */
  const tenantUser =
    await findUserInTenantByEmail(
      tenantId,
      email
    );

  if (
    tenantUser &&
    tenantUser.is_active === false
  ) {
    const error = new Error(
      "This user already exists in this company and is currently deactivated."
    );

    error.statusCode = 409;
    error.code = "USER_DEACTIVATED";
    error.userId = tenantUser.id;
    error.isVerified =
      tenantUser.is_verified === true;

    throw error;
  }

  const code = Math.floor(
    100000 + Math.random() * 900000
  ).toString();

  const expires = new Date(
    Date.now() + 15 * 60 * 1000
  );

  const twofaRequired =
    data.twofa_required ?? true;

  try {
    const result = await db.query(
      `INSERT INTO users
       (
         tenant_id,
         email,
         first_name,
         last_name,
         display_name,
         phone,
         job_title,
         department,
         password_hash,
         is_active,
         is_verified,
         verification_code,
         verification_expires,
         twofa_required,
         created_by,
         created_at,
         updated_at
       )
       VALUES
       (
         $1,
         $2,
         $3,
         $4,
         $5,
         $6,
         $7,
         $8,
         NULL,
         true,
         false,
         $9,
         $10,
         $11,
         $12,
         now(),
         now()
       )
       RETURNING *`,
      [
        tenantId,
        email,
        data.first_name.trim(),
        data.last_name.trim(),

        data.display_name?.trim() ||
        `${data.first_name.trim()} ${data.last_name.trim()}`,

        data.phone?.trim() || null,
        data.job_title?.trim() || null,
        data.department?.trim() || null,

        code,
        expires,
        twofaRequired,
        adminId
      ]
    );

    const activationEmail =
      buildActivationEmail({
        firstName:
          data.first_name.trim(),

        code,

        twofaRequired
      });

    await sendEmail({
      to: email,
      ...activationEmail
    });

    return {
      success: true,
      user: mapRow(result.rows[0]),
      email,
      message:
        "Invitation sent successfully"
    };
  } catch (err) {
    if (
      err.code === "23505" &&
      err.constraint ===
      "cpmsoft_user_email_key"
    ) {
      const conflictingUser =
        await findActiveUserByEmail(email);

      if (conflictingUser) {
        if (
          conflictingUser.tenant_id ===
          tenantId
        ) {
          const error = new Error(
            "A user with this email is already active in this company."
          );

          error.statusCode = 409;
          error.code =
            "USER_ALREADY_EXISTS";
          error.userId =
            conflictingUser.id;
          error.isVerified =
            conflictingUser.is_verified ===
            true;

          throw error;
        }

        throw createActiveEmailError();
      }

      const error = new Error(
        "This email address is already associated with an active account."
      );

      error.statusCode = 409;
      error.code =
        "EMAIL_ACTIVE_IN_ANOTHER_TENANT";

      throw error;
    }

    throw err;
  }
}

async function activateUser(email, code, password) {
  const emailNormalized = String(email || "").trim().toLowerCase();
  const codeNormalized = String(code || "").trim();

  if (!emailNormalized || !codeNormalized || !password) {
    const error = new Error(
      "Email, verification code, and password are required."
    );
    error.statusCode = 400;
    error.code = "ACTIVATION_FIELDS_REQUIRED";
    throw error;
  }

  if (!/^(?=.*\d).{8,}$/.test(password)) {
    const error = new Error(
      "Password must be at least 8 characters and contain at least one number."
    );
    error.statusCode = 400;
    error.code = "INVALID_PASSWORD";
    throw error;
  }

  const result = await db.query(
    `SELECT id,
            is_verified,
            verification_code,
            verification_expires
     FROM users
     WHERE LOWER(email) = LOWER($1)
     AND is_active = true
     LIMIT 1`,
    [emailNormalized]
  );

  if (!result.rowCount) {
    const error = new Error(
      "The email address or activation code is invalid."
    );
    error.statusCode = 400;
    error.code = "INVALID_ACTIVATION";
    throw error;
  }

  const user = result.rows[0];

  if (user.is_verified) {
    const error = new Error(
      "This account has already been activated. Please sign in to continue."
    );
    error.statusCode = 409;
    error.code = "ALREADY_ACTIVATED";
    throw error;
  }

  if (
    !user.verification_code ||
    user.verification_code !== codeNormalized
  ) {
    const error = new Error("The activation code is invalid.");
    error.statusCode = 400;
    error.code = "INVALID_CODE";
    throw error;
  }

  if (
    !user.verification_expires ||
    new Date(user.verification_expires) < new Date()
  ) {
    const error = new Error(
      "The activation code has expired. Please ask your administrator to resend the invitation."
    );
    error.statusCode = 400;
    error.code = "CODE_EXPIRED";
    throw error;
  }

  const password_hash = await bcrypt.hash(password, 10);

  const updateResult = await db.query(
    `UPDATE users
     SET password_hash = $1,
         is_verified = true,
         verified_at = now(),
         verification_code = NULL,
         verification_expires = NULL
     WHERE id = $2
       AND is_verified = false
     RETURNING id`,
    [password_hash, user.id]
  );

  if (!updateResult.rowCount) {
    const error = new Error(
      "This account has already been activated. Please sign in to continue."
    );
    error.statusCode = 409;
    error.code = "ALREADY_ACTIVATED";
    throw error;
  }

  return {
    success: true,
    code: "ACTIVATED",
    message: "Account activated successfully."
  };
}

async function reactivateUser(
  tenantId,
  userId
) {
  const result = await db.query(
    `SELECT *
     FROM users
     WHERE tenant_id = $1
       AND id = $2`,
    [tenantId, userId]
  );

  if (!result.rowCount) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    error.code = "USER_NOT_FOUND";
    throw error;
  }

  const user = result.rows[0];

  if (user.is_active) {
    return {
      reactivated: false,
      inviteSent: false,
      alreadyActive: true
    };
  }

  const activeUser =
    await findActiveUserByEmail(
      user.email,
      user.id
    );

  if (activeUser) {
    throw createActiveEmailError();
  }

  if (user.is_verified) {
    try {
      await db.query(
        `UPDATE users
         SET is_active = true,
             deactivated_at = NULL,
             deactivated_by = NULL,
             updated_at = now()
         WHERE id = $1
           AND tenant_id = $2`,
        [userId, tenantId]
      );
    } catch (err) {
      if (
        err.code === "23505" &&
        err.constraint ===
        "cpmsoft_user_email_key"
      ) {
        const conflictingUser =
          await findActiveUserByEmail(
            user.email,
            user.id
          );

        if (conflictingUser) {
          throw createActiveEmailError();
        }
      }

      throw err;
    }

    return {
      reactivated: true,
      inviteSent: false
    };
  }

  const code = Math.floor(
    100000 + Math.random() * 900000
  ).toString();

  const expires = new Date(
    Date.now() + 15 * 60 * 1000
  );

  try {
    await db.query(
      `UPDATE users
       SET is_active = true,
           verification_code = $1,
           verification_expires = $2,
           deactivated_at = NULL,
           deactivated_by = NULL,
           updated_at = now()
       WHERE id = $3
         AND tenant_id = $4`,
      [
        code,
        expires,
        userId,
        tenantId
      ]
    );
  } catch (err) {
    if (
      err.code === "23505" &&
      err.constraint ===
      "cpmsoft_user_email_key"
    ) {
      const conflictingUser =
        await findActiveUserByEmail(
          user.email,
          user.id
        );

      if (conflictingUser) {
        throw createActiveEmailError();
      }
    }

    throw err;
  }

  await sendEmail({
    to: user.email,
    ...buildActivationEmail({
      firstName: user.first_name,
      code,
      twofaRequired:
        user.twofa_required === true
    })
  });

  return {
    reactivated: true,
    inviteSent: true
  };
}



module.exports = {
  countUsers,
  getUsers,
  getById,
  create,
  update,
  softDelete,
  checkEmailExists,
  resendInvite,
  inviteUser,
  activateUser,
  reactivateUser
};