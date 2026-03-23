async function buildUserTokenPayload(user, appDb, accessService) {

  const permissions = await accessService.getUserPermissions(
    user.tenant_id,
    user.id
  );

  const rolesResult = await appDb.query(
    `SELECT r.role_code
     FROM user_roles ur
     JOIN roles r ON r.id = ur.role_id
     WHERE ur.tenant_id = $1
       AND ur.user_id = $2
       AND ur.is_active = true`,
    [user.tenant_id, user.id]
  );

  const roles = rolesResult.rows.map(r => r.role_code);

  return {
    userId: user.id,
    email: user.email,
    tenantId: user.tenant_id,
    roles,
    permissions
  };
}

module.exports = {
  buildUserTokenPayload
};