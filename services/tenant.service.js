async function isTenantOwner(userId, tenantId) {

  const result = await db.query(
    `SELECT owner_user_id
     FROM tenants
     WHERE id = $1`,
    [tenantId]
  );

  return result.rows[0]?.owner_user_id === userId;
}