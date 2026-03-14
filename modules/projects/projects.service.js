const db = require('../../db/appDb');

async function getAll(tenantId) {
  const result = await db.query(`
    SELECT 
      p.id,
      p.project_code,
      p.name,
      p.status,
      p.start_date,
      p.end_date,
      p.customer_id,
      c.name AS customer_name
    FROM projects p
    JOIN customers c
      ON p.customer_id = c.id
    WHERE p.tenant_id = $1
      AND p.is_deleted = false
    ORDER BY p.name
  `, [tenantId]);

  return result.rows.map(r => ({
    id: r.id,
    projectCode: r.project_code,
    name: r.name,
    status: r.status,
    startDate: r.start_date,
    endDate: r.end_date,
    customerId: r.customer_id,
    customerName: r.customer_name
  }));
}

module.exports = { getAll };