const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../../db/authDb');
const appDb = require('../../db/appDb');
const verifyToken = require('../../middleware/verifyToken');
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const { sendEmail } = require('../../services/emailService');
const service = require('../users/users.service');
const accessService = require('../../services/access.service');
const { buildUserTokenPayload } = require('../../services/auth.service');

module.exports = async function authRoutes(fastify) {




  // -----------------------------
  // SHARED PASSWORD UPDATE
  // -----------------------------
  async function updateUserPassword(userId, newPassword) {

    // Password rule: min 8 + at least 1 number
    if (!/^(?=.*\d).{8,}$/.test(newPassword)) {
      throw new Error("Password must be at least 8 characters and contain at least one number.");
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await db.query(
      `UPDATE users
     SET password_hash = $1,
         reset_code = NULL,
         reset_code_expires = NULL
     WHERE id = $2`,
      [hashed, userId]
    );
  }



  // -----------------------------
  // TEST
  // -----------------------------
  fastify.get('/_test', async () => {
    return { ok: true };
  });

  // -----------------------------
  // LOGIN SWAGGER ONLY
  // -----------------------------  
  fastify.post('/login-swagger', {
    schema: {
      summary: 'Swagger Test Login',
      tags: ['Auth'],
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string' },
          password: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {

    const { email, password } = request.body;

    const result = await db.query(
      `SELECT id,email,first_name,last_name,tenant_id,
            password_hash,is_active
     FROM users
     WHERE email = $1
       AND is_active = true
       AND COALESCE(is_active, true) = true
       AND is_unsubscribed = false`,
      [email]
    );

    if (!result.rowCount) {
      return reply.code(401).send({ error: 'Invalid login' });
    }

    const user = result.rows[0];

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return reply.code(401).send({ error: 'Invalid login' });
    }

    // 🔒 Optional: restrict to admin users only
    // if (user.role !== 'admin') {
    //   return reply.code(403).send({ error: 'Swagger login restricted to admins' });
    // }

 const payload = await buildUserTokenPayload(user, appDb, accessService);

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '8h'
    });
    return {
      token
    };
  });

  // -----------------------------
  // LOGIN SWAGGER ONLY ENDS
  // -----------------------------  

  // -----------------------------
  // LOGIN
  // -----------------------------

  fastify.post('/login', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string' },
          password: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {

    const { email, password } = request.body;

    const result = await db.query(
      `SELECT id, email, first_name, last_name, tenant_id,
            password_hash, twofa_required, twofa_enabled,
            twofa_secret, theme_mode, accent_theme,
            is_active, is_verified, is_unsubscribed
     FROM users
     WHERE email = $1
       AND is_active = true
       AND is_unsubscribed = false
     LIMIT 1`,
      [email]
    );

    if (!result.rowCount) {
      return reply.code(401).send({ error: 'Invalid login' });
    }

    const user = result.rows[0];

    // EXTRA SAFETY
    if (!user.is_active) {
      return reply.code(403).send({
        error: "Account disabled. Contact administrator."
      });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return reply.code(401).send({ error: 'Invalid login' });
    }

    if (!user.is_verified) {
      return reply.code(403).send({
        error: "Account not activated. Please activate your account first."
      });
    }

    // 🔐 2FA FLOW (UNCHANGED)
    if (user.twofa_required) {

      if (!user.twofa_enabled || !user.twofa_secret) {
        return {
          requires2faSetup: true,
          userId: user.id,
          email: user.email
        };
      }

      return {
        requires2faVerify: true,
        userId: user.id
      };
    }

    // -----------------------------
    // 🔥 RESOLVE PERMISSIONS
    // -----------------------------
    const permissions = await accessService.getUserPermissions(
      user.tenant_id,
      user.id
    );

    // OPTIONAL: also get role IDs (for UI if needed later)
    const rolesResult = await appDb.query(
      `SELECT r.role_code
     FROM user_roles ur
     JOIN roles r ON r.id = ur.role_id
     WHERE ur.tenant_id = $1
       AND ur.user_id = $2
       AND ur.is_active = true`,
      [user.tenant_id, user.id]
    );

    const roles = rolesResult.rows.map(r => r.role_code);

    // -----------------------------
    // UPDATE LAST LOGIN
    // -----------------------------
    await db.query(
      `UPDATE users
     SET last_login_at = now()
     WHERE id = $1`,
      [user.id]
    );

    // -----------------------------
    // 🔐 JWT TOKEN (UPDATED)
    // -----------------------------
    const payload = await buildUserTokenPayload(user, appDb, accessService);

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '8h'
    });
    // -----------------------------
    // RESPONSE
    // -----------------------------
    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        tenant_id: user.tenant_id,

        // optional (for UI)
        roles,

        twofaRequired: user.twofa_required,
        themeMode: user.theme_mode || 'dark',
        accentTheme: user.accent_theme || 'theme-blue'
      }
    };

  });

  // -----------------------------
  // SEND RESET CODE (PUBLIC)
  // -----------------------------
  fastify.post('/send-reset-code', {
    schema: {
      summary: 'Send password reset code',
      tags: ['Auth'],
      body: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {

    const { email } = request.body;

    const result = await db.query(
      `SELECT id, first_name
     FROM users
     WHERE email = $1
       AND is_active = true`,
      [email]
    );

    if (!result.rowCount) {
      // Do not reveal if email exists
      return { message: "If the email exists, a reset code has been sent." };
    }

    const user = result.rows[0];

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 10);

    await db.query(
      `UPDATE users
     SET reset_code = $1,
         reset_code_expires = $2
     WHERE id = $3`,
      [resetCode, expires, user.id]
    );

    await sendEmail({
      to: email,
      subject: 'CPMSOFT Password Reset Code',
      text: `Your password reset code is: ${resetCode}. This code expires in 10 minutes.`,
      html: `<p>Your password reset code is:</p>
           <h2>${resetCode}</h2>
           <p>This code expires in 10 minutes.</p>`
    });

    return { message: "If the email exists, a reset code has been sent." };
  });

  // -----------------------------
  // VERIFY RESET CODE (PUBLIC)
  // -----------------------------
  fastify.post('/verify-reset-code', {
    schema: {
      summary: 'Verify reset code',
      tags: ['Auth'],
      body: {
        type: 'object',
        required: ['email', 'code'],
        properties: {
          email: { type: 'string' },
          code: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {

    const { email, code } = request.body;

    const result = await db.query(
      `SELECT reset_code, reset_code_expires
     FROM users
     WHERE email = $1`,
      [email]
    );

    if (!result.rowCount) {
      return reply.code(400).send({ error: "Invalid code." });
    }

    const user = result.rows[0];

    if (!user.reset_code || user.reset_code !== code) {
      return reply.code(400).send({ error: "Invalid code." });
    }

    if (!user.reset_code_expires || new Date(user.reset_code_expires) < new Date()) {
      return reply.code(400).send({ error: "Code expired." });
    }

    return { valid: true };
  });

  // -----------------------------
  // ADMIN RESET USER PASSWORD
  // -----------------------------
  fastify.post('/admin/users/:id/reset-password', {
    preHandler: verifyToken,
    schema: {
      summary: 'Admin reset user password',
      tags: ['Admin'],
      params: {
        type: 'object',
        properties: {
          id: { type: 'string' }
        }
      },
      body: {
        type: 'object',
        required: ['newPassword'],
        properties: {
          newPassword: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {

    if (request.user.role !== 'admin') {
      return reply.code(403).send({ error: "Unauthorized" });
    }

    const userId = request.params.id;
    const { newPassword } = request.body;

    try {
      await updateUserPassword(userId, newPassword);
    } catch (err) {
      return reply.code(400).send({ error: err.message });
    }

    return { message: "User password reset successfully." };
  });

  // -----------------------------
  // RESET PASSWORD WITH CODE (PUBLIC)
  // -----------------------------
  fastify.post('/reset-password-code', {
    schema: {
      summary: 'Reset password using code',
      tags: ['Auth'],
      body: {
        type: 'object',
        required: ['email', 'code', 'newPassword'],
        properties: {
          email: { type: 'string' },
          code: { type: 'string' },
          newPassword: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {

    const { email, code, newPassword } = request.body;

    const result = await db.query(
      `SELECT id, reset_code, reset_code_expires
     FROM users
     WHERE email = $1`,
      [email]
    );

    if (!result.rowCount) {
      return reply.code(400).send({ error: "Invalid code or email." });
    }

    const user = result.rows[0];

    if (!user.reset_code || user.reset_code !== code) {
      return reply.code(400).send({ error: "Invalid code or email." });
    }

    if (!user.reset_code_expires || new Date(user.reset_code_expires) < new Date()) {
      return reply.code(400).send({ error: "Reset code expired." });
    }

    try {
      await updateUserPassword(user.id, newPassword);
    } catch (err) {
      return reply.code(400).send({ error: err.message });
    }

    return { message: "Password updated successfully." };
  });

  // -----------------------------
  // CHANGE PASSWORD (AUTHENTICATED)
  // -----------------------------
  fastify.post('/change-password', {
    preHandler: verifyToken,
    schema: {
      summary: 'Change own password',
      tags: ['Auth'],
      body: {
        type: 'object',
        required: ['newPassword'],
        properties: {
          newPassword: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {

    const userId = request.user.userId;
    const { newPassword } = request.body;

    try {
      await updateUserPassword(userId, newPassword);
    } catch (err) {
      return reply.code(400).send({ error: err.message });
    }

    return { message: "Password changed successfully." };
  });

  // -----------------------------
  // 2FA SETUP FIRST (PUBLIC)
  // -----------------------------
  fastify.post('/2fa/setup-first', async (request, reply) => {
    console.log("SETUP-FIRST BODY:", request.body);

    const { userId, email } = request.body || {};

    if (!userId || !email) {
      return reply.code(400).send({
        error: "Missing userId/email",
        received: request.body
      });
    }
    const result = await db.query(
      `SELECT id FROM users WHERE id = $1`,
      [userId]
    );

    if (!result.rows.length) {
      return reply.code(400).send({ error: "User not found" });
    }

    const secret = speakeasy.generateSecret({
      length: 20,
      name: `CPMSOFT (${email})`
    });

    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    await db.query(
      `UPDATE users SET twofa_secret = $1 WHERE id = $2`,
      [secret.base32, userId]
    );

    return {
      qrCode,
      manualCode: secret.base32
    };
  });

  // -----------------------------
  // 2FA VERIFY LOGIN
  // -----------------------------
  fastify.post('/2fa/login-verify', async (request, reply) => {

    const { userId, token: otp } = request.body;

    const result = await db.query(
      `SELECT * FROM users WHERE id = $1`,
      [userId]
    );

    if (!result.rows.length) {
      return reply.code(400).send({ error: "User not found" });
    }

    const user = result.rows[0];

    const permissions = await accessService.getUserPermissions(
      user.tenant_id,
      user.id
    );

    // GET ROLES
    const rolesResult = await appDb.query(
      `SELECT r.role_code
   FROM user_roles ur
   JOIN roles r ON r.id = ur.role_id
   WHERE ur.tenant_id = $1
     AND ur.user_id = $2
     AND ur.is_active = true`,
      [user.tenant_id, user.id]
    );

    const roles = rolesResult.rows.map(r => r.role_code);


    const verified = speakeasy.totp.verify({
      secret: user.twofa_secret,
      encoding: 'base32',
      token: otp
    });

    if (!verified) {
      return reply.code(400).send({ error: "Invalid code" });
    }

    await db.query(
      `UPDATE users SET twofa_enabled = true WHERE id = $1`,
      [userId]
    );

    // build payload
    const payload = await buildUserTokenPayload(user, appDb, accessService);

    // generate JWT
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '8h'
    });

    return {
      token: token,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        tenant_id: user.tenant_id,
        role: user.role,
        twofaRequired: true,
        themeMode: user.theme_mode || 'dark',
        accentTheme: user.accent_theme || 'theme-blue'
      }
    };
  });

  // -----------------------------
  // CURRENT USER
  // -----------------------------
  fastify.get('/me', {
    preHandler: verifyToken
  }, async (request) => {

    return {
      userId: request.user.userId,
      email: request.user.email,
      role: request.user.role
    };
  });

  // -----------------------------
  // GET EXISTING 2FA QR
  // -----------------------------
  fastify.post('/2fa/show-existing', async (request, reply) => {

    const { userId } = request.body;

    const result = await db.query(
      `SELECT twofa_secret, email
     FROM users
     WHERE id = $1`,
      [userId]
    );

    if (!result.rows.length || !result.rows[0].twofa_secret) {
      return reply.code(400).send({ error: "2FA not configured" });
    }

    const user = result.rows[0];

    const secret = user.twofa_secret;
    console.log("Secret from DB:", JSON.stringify(secret));
    console.log("Type of secret:", typeof secret);
    console.log("Email:", user.email);

    const otpauth = speakeasy.otpauthURL({
      secret,
      label: `CPMSOFT (${user.email})`,
      issuer: "CPMSOFT",
      encoding: "base32"
    });

    const qrCode = await QRCode.toDataURL(otpauth);

    return {
      qrCode,
      manualCode: secret
    };
  });

  // -----------------------------
  // INVITE USER
  // -----------------------------
  fastify.post('/invite-user', {
    preHandler: verifyToken,
    schema: {
      body: {
        type: 'object',
        required: ['email', 'first_name', 'last_name'],
        properties: {
          email: {
            type: 'string',
            format: 'email'
          },
          first_name: {
            type: 'string'
          },
          last_name: {
            type: 'string'
          },
          role: {
            type: 'string',
            enum: ['admin', 'manager', 'user', 'viewer']
          }
        }
      }
    }
  }, async (request, reply) => {

    const tenantId = request.user.tenantId;
    const adminId = request.user.userId;

    const { email, first_name, last_name, role } = request.body;

    return service.inviteUser(
      tenantId,
      adminId,
      {
        email,
        first_name,
        last_name,
        role
      }
    );

  });
  // -----------------------------
  // ACTIVATE USER
  // -----------------------------

  fastify.post('/activate', async (request, reply) => {

    const { email, code, password } = request.body;

    return service.activateUser(email, code, password);

  });

};
