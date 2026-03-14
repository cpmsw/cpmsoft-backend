module.exports = function requireRole(allowedRoles = []) {
    return async function (request, reply) {
        const role = request.user?.role;

        if (!role) {
            return reply.code(403).send({ error: 'Role missing' });
        }

        if (!allowedRoles.includes(role)) {
            return reply.code(403).send({ error: 'Forbidden' });
        }
    };
};
