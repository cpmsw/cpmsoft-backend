const db = require('../db/appDb');

// -----------------------------
// GET USER PERMISSIONS
// -----------------------------
async function getUserPermissions(tenantId, userId) {

        const dbCheck = await db.query('SELECT current_database()');
    // console.log("CONNECTED DB:", dbCheck.rows[0].current_database);


    const result = await db.query(
        `SELECT DISTINCT p.permission_key
     FROM user_roles ur
     JOIN role_permissions rp 
       ON rp.role_id = ur.role_id
      AND rp.tenant_id = ur.tenant_id
     JOIN permissions p 
       ON p.id = rp.permission_id
     WHERE ur.tenant_id = $1
       AND ur.user_id = $2
       AND ur.is_active = true
       AND p.is_active = true`,
        [tenantId, userId]
    );

    return result.rows.map(r => r.permission_key);
}

module.exports = {
    getUserPermissions
};