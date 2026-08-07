const jwt = require("jsonwebtoken");

const authDb =
  require("cpmsoft-core/common/db/authDb");

module.exports =
async function verifyToken(request, reply) {

  const authHeader =
    request.headers.authorization;

  if (!authHeader) {
    return reply.code(401).send({
      error: "Unauthorized",
      code: "AUTH_HEADER_MISSING",
      message:
        "Authorization is required."
    });
  }

  const [scheme, token] =
    authHeader.split(" ");

  if (
    scheme !== "Bearer" ||
    !token
  ) {
    return reply.code(401).send({
      error: "Unauthorized",
      code: "INVALID_AUTH_FORMAT",
      message:
        "Invalid authorization format."
    });
  }

  try {

    // --------------------------------
    // VERIFY JWT
    // --------------------------------
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const userId =
      decoded.userId;

    const tenantId =
      decoded.tenantId ||
      decoded.tenant_id;

    if (!userId || !tenantId) {
      return reply.code(401).send({
        error: "Unauthorized",
        code: "INVALID_TOKEN_CLAIMS",
        message:
          "Invalid authentication token."
      });
    }

    // --------------------------------
    // CURRENT USER SECURITY STATE
    // --------------------------------
    const result =
      await authDb.query(
        `SELECT
           id,
           email,
           tenant_id,
           is_active,
           is_verified,
           is_unsubscribed
         FROM users
         WHERE id = $1
           AND tenant_id = $2
         LIMIT 1`,
        [
          userId,
          tenantId
        ]
      );

    if (!result.rowCount) {
      return reply.code(401).send({
        error: "Unauthorized",
        code: "ACCOUNT_NOT_FOUND",
        message:
          "The account is no longer available."
      });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return reply.code(401).send({
        error: "Unauthorized",
        code: "ACCOUNT_INACTIVE",
        message:
          "The account has been deactivated."
      });
    }

    if (!user.is_verified) {
      return reply.code(401).send({
        error: "Unauthorized",
        code: "ACCOUNT_NOT_VERIFIED",
        message:
          "The account is not activated."
      });
    }

    if (user.is_unsubscribed) {
      return reply.code(401).send({
        error: "Unauthorized",
        code: "ACCOUNT_UNAVAILABLE",
        message:
          "The account is unavailable."
      });
    }

    // --------------------------------
    // CURRENT AUTHENTICATED IDENTITY
    // --------------------------------
    request.user = {
      userId: user.id,
      tenantId: user.tenant_id,
      email: user.email,

      // Temporary compatibility only.
      // Do NOT use these for authoritative
      // authorization decisions.
      roles: decoded.roles || [],
      permissions:
        decoded.permissions || []
    };

  } catch (err) {

    if (
      err.name === "TokenExpiredError"
    ) {
      return reply.code(401).send({
        error: "Unauthorized",
        code: "TOKEN_EXPIRED",
        message:
          "Your session has expired."
      });
    }

    return reply.code(401).send({
      error: "Unauthorized",
      code: "INVALID_TOKEN",
      message:
        "Invalid authentication token."
    });
  }
};