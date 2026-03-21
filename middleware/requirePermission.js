module.exports = function (permission) {

  return async function (request, reply) {

    const userPermissions = request.user.permissions || [];

    if (!userPermissions.includes(permission)) {
      return reply.code(403).send({
        error: "Forbidden",
        message: "Missing permission: " + permission
      });
    }

  };

};