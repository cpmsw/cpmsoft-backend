const db = require('../../db/appDb');

function mapCustomer(r) {
  return {
    id: r.id,
    customerCode: r.customer_code,
    name: r.name,
    email: r.email,
    phone: r.phone
  };
}

/**
 * Get all customers (active only)
 */
async function getAll(tenantId, search) {

  // If no search → return last 100
  if (!search) {
    const result = await db.query(
      `SELECT *
       FROM customers
       WHERE tenant_id = $1
         AND is_deleted = false
       ORDER BY created_at DESC
       LIMIT 100`,
      [tenantId]
    );

    return result.rows.map(mapCustomer);
  }

  // If search provided
  const result = await db.query(
    `SELECT *
     FROM customers
     WHERE tenant_id = $1
       AND is_deleted = false
       AND (
         customer_code ILIKE $2 OR
         name ILIKE $2 OR
         email ILIKE $2 OR
         phone ILIKE $2
       )
     ORDER BY name
     LIMIT 100`,
    [tenantId, `%${search}%`]
  );

  return result.rows.map(mapCustomer);
}
/**
 * Get by Id
 */
async function getById(tenantId, id) {
  const result = await db.query(
    `SELECT *
     FROM customers
     WHERE id = $1
       AND tenant_id = $2
       AND is_deleted = false`,
    [id, tenantId]
  );
  
  if (result.rowCount === 0) {
    throw new Error('Customer not found');
  }

  const r = result.rows[0];

  return {
    id: r.id,
    customerCode: r.customer_code,
    name: r.name,
    email: r.email,
    phone: r.phone
  };
}

/**
 * Create new customer
 */
async function create(tenantId, userId, data) {
  const { customerCode, name, email, phone } = data;

  if (!name) {
    throw new Error('Customer name is required');
  }

  const result = await db.query(
    `INSERT INTO customers
      (tenant_id, customer_code, name, email, phone, created_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [tenantId, customerCode, name, email, phone, userId]
  );

  return result.rows[0];
}

/**
 * Update customer
 */
async function update(tenantId, userId, id, data) {
  const { customerCode, name, email, phone } = data;

  const result = await db.query(
    `UPDATE customers
     SET customer_code = $1,
         name = $2,
         email = $3,
         phone = $4,
         updated_by = $5
     WHERE id = $6
       AND tenant_id = $7
       AND is_deleted = false
     RETURNING *`,
    [customerCode, name, email, phone, userId, id, tenantId]
  );

  if (result.rowCount === 0) {
    throw new Error('Customer not found');
  }

  return result.rows[0];
}

/**
 * Soft delete customer
 */
async function softDelete(tenantId, userId, id) {
  const result = await db.query(
    `UPDATE customers
     SET is_deleted = true,
         deleted_at = now(),
         deleted_by = $1
     WHERE id = $2
       AND tenant_id = $3
       AND is_deleted = false`,
    [userId, id, tenantId]
  );

  if (result.rowCount === 0) {
    throw new Error('Customer not found');
  }

  return true;
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  softDelete
};