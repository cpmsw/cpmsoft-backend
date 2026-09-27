const accessService =
  require("../services/access.service");


module.exports =
function requireAdministrator() {

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


    try {

      const isAdministrator =
        await accessService.isAdministrator(
          tenantId,
          userId
        );


      if (!isAdministrator) {

        return reply.code(403).send({
          error: "Forbidden",
          code: "ADMIN_REQUIRED",
          message:
            "Administrator access is required."
        });
      }

    } catch (error) {

      request.log.error(error);

      return reply.code(500).send({
        error: "Server Error",
        code: "ADMIN_CHECK_FAILED",
        message:
          "Unable to verify administrator access."
      });
    }

  };
};