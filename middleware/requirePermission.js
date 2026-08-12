const accessService =
  require("../services/access.service");


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


    try {

      const hasPermission =
        await accessService.hasPermission(
          tenantId,
          userId,
          permissionKey
        );


      if (!hasPermission) {

        return reply.code(403).send({
          error: "Forbidden",
          code: "PERMISSION_DENIED",
          message:
            "You do not have permission to perform this action."
        });
      }


    } catch (error) {

      request.log.error(error);

      return reply.code(500).send({
        error: "Server Error",
        code:
          "PERMISSION_CHECK_FAILED",
        message:
          "Unable to verify permission."
      });
    }

  };
};