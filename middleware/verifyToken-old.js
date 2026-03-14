const jwt = require('jsonwebtoken');

module.exports = async function verifyToken(request, reply) {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
        return reply.code(401).send({
            error: 'Missing Authorization header'
        });
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return reply.code(401).send({
            error: 'Invalid Authorization format'
        });
    }

    const token = parts[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach user info to request
        request.user = decoded;

    } catch (err) {
        return reply.code(401).send({
            error: 'Invalid or expired token'
        });
    }
};
