const jwt = require('jsonwebtoken');
const db = require('../db/authDb'); // 🔥 required

module.exports = async function verifyToken(request, reply) {

  const authHeader = request.headers.authorization;

  if (!authHeader) {
    return reply.code(401).send({ error: 'Missing Authorization header' });
  }

  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return reply.code(401).send({ error: 'Invalid Authorization format' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔒 HR termination protection
    const result = await db.query(
      `SELECT COALESCE(is_active, true) as is_active
       FROM users
       WHERE id = $1`,
      [decoded.userId]
    );

    if (!result.rows.length || result.rows[0].is_active === false) {
      return reply.code(401).send({ error: "Account disabled" });
    }

    request.user = {
      userId: decoded.userId,
      email: decoded.email,
      tenantId: decoded.tenantId || decoded.tenant_id,  // ✅ HANDLE BOTH
      roles: decoded.roles || [],
      permissions: decoded.permissions || []
    };

  } catch (err) {
    return reply.code(401).send({ error: 'Invalid or expired token' });
  }
};
