const verifyToken = require("../middleware/verifyToken");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const db = require("../db/authDb");

module.exports = async function (fastify, opts) {

  /*
  ==========================================
  2FA SETUP
  ==========================================
  Generates secret + QR code
  Does NOT enable 2FA yet
  */

  fastify.post("/2fa/setup", {
    preHandler: verifyToken
  }, async (request, reply) => {

    const userId = request.user.userId;

    const secret = speakeasy.generateSecret({
      length: 20,
      name: `CPMSOFT (${request.user.email})`
    });

    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    await db.query(
      `UPDATE users
       SET twofa_secret = $1,
           twofa_enabled = false
       WHERE id = $2`,
      [secret.base32, userId]
    );

    return {
      qrCode,
      manualCode: secret.base32
    };
  });


  /*
  ==========================================
  2FA VERIFY
  ==========================================
  Verifies code and enables 2FA
  */

  fastify.post("/2fa/verify", {
    preHandler: verifyToken
  }, async (request, reply) => {

    const userId = request.user.userId;
    const { token } = request.body;

    if (!token) {
      return reply.code(400).send({ error: "Token required" });
    }

    const result = await db.query(
      `SELECT twofa_secret FROM users WHERE id = $1`,
      [userId]
    );

    if (!result.rows.length || !result.rows[0].twofa_secret) {
      return reply.code(400).send({ error: "2FA not initialized" });
    }

    const verified = speakeasy.totp.verify({
      secret: result.rows[0].twofa_secret,
      encoding: "base32",
      token,
      window: 1
    });

    if (!verified) {
      return reply.code(400).send({ error: "Invalid code" });
    }

    await db.query(
      `UPDATE users
       SET twofa_enabled = true
       WHERE id = $1`,
      [userId]
    );

    return { success: true };
  });

};
