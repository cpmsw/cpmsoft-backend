const appDb =
  require("cpmsoft-core/common/db/appDb");

module.exports =
function requirePermission(permissionKey) {

  return async function (request, reply) {

    const userId =
      request.user?.userId;

    const tenantId =
      request.user?.tenantId;

    if (!userId || !tenantId) {
      return reply.code(401).send({
        error: "Unauthorized",
        code: "AUTH_CONTEXT_MISSING",
        message:
          "Authentication is required."
      });
    }

    if (!permissionKey) {
      return reply.code(500).send({
        error: "Server Error",
        code:
          "PERMISSION_CONFIGURATION_ERROR",
        message:
          "Permission configuration is invalid."
      });
    }

    const result = await appDb.query(
      `SELECT EXISTS (
         SELECT 1
         FROM user_roles ur

         INNER JOIN roles r
           ON r.id = ur.role_id
          AND r.tenant_id = ur.tenant_id

         INNER JOIN role_permissions rp
           ON rp.role_id = ur.role_id
          AND rp.tenant_id = ur.tenant_id

         INNER JOIN permissions p
           ON p.id = rp.permission_id

         WHERE ur.tenant_id = $1
           AND ur.user_id = $2
           AND ur.is_active = true
           AND r.is_active = true
           AND p.is_active = true
           AND p.permission_key = $3
       ) AS has_permission`,
      [
        tenantId,
        userId,
        permissionKey
      ]
    );

    const hasPermission =
      result.rows[0]?.has_permission === true;

    if (!hasPermission) {
      return reply.code(403).send({
        error: "Forbidden",
        code: "PERMISSION_DENIED",
        message:
          "You do not have permission to perform this action."
      });
    }
  };
};