function getTenant(request) {
    if (!request.user || !request.user.tenantId) {
        throw new Error('Tenant not found on request context');
    }
    return request.user.tenantId;
}

module.exports = { getTenant };
