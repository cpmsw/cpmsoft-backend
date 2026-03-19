const appDb = require('../../db/appDb');
const { getTenant } = require('../../services/tenant');
const requireRole = require('../../middleware/requireRole');

module.exports = async function (fastify) {

  // ===============================
  // GET ALL PROJECTS
  // ===============================
  fastify.get('/', {
    schema: {
      summary: 'List projects',
      tags: ['Projects'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  projectCode: { type: 'string' },
                  name: { type: 'string' },
                  customerName: { type: 'string' },
                  status: { type: 'string' },
                  startDate: { type: 'string' },
                  endDate: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  }, async (request) => {

    const tenantId = getTenant(request);

    const result = await appDb.query(`
      SELECT 
        p.id,
        p.project_code,
        p.name,
        p.status,
        p.start_date,
        p.end_date,
        c.name AS customer_name
      FROM projects p
      JOIN customers c
        ON p.customer_id = c.id
      WHERE p.tenant_id = $1
        AND p.is_active = true
      ORDER BY p.created_at DESC
    `, [tenantId]);

    const data = result.rows.map(r => ({
      id: r.id,
      projectCode: r.project_code,
      name: r.name,
      customerName: r.customer_name,
      status: r.status,
      startDate: r.start_date,
      endDate: r.end_date
    }));

    return {
      success: true,
      data
    };
  });

  // ===============================
  // CREATE PROJECT (ADMIN ONLY)
  // ===============================
  fastify.post('/', {
    preHandler: requireRole(['admin']),
    schema: {
      summary: 'Create project',
      tags: ['Projects'],
      body: {
        type: 'object',
        required: ['name', 'customerId'],
        properties: {
          projectCode: { type: 'string', maxLength: 50 },
          name: { type: 'string', minLength: 1 },
          customerId: { type: 'string', format: 'uuid' },
          status: { type: 'string', default: 'active' },
          startDate: { type: 'string', format: 'date' },
          endDate: { type: 'string', format: 'date' },
          notes: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                projectCode: { type: 'string' },
                name: { type: 'string' },
                customerId: { type: 'string' },
                status: { type: 'string' },
                startDate: { type: 'string' },
                endDate: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, async (request) => {

    const tenantId = getTenant(request);
    const userId = request.user.userId;

    const {
      projectCode,
      name,
      customerId,
      status,
      startDate,
      endDate,
      notes
    } = request.body;

    const result = await appDb.query(`
      INSERT INTO projects (
        tenant_id,
        project_code,
        name,
        customer_id,
        status,
        start_date,
        end_date,
        notes,
        created_by
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *
    `, [
      tenantId,
      projectCode,
      name,
      customerId,
      status,
      startDate,
      endDate,
      notes,
      userId
    ]);

    return {
      success: true,
      data: result.rows[0]
    };
  });

  // ===============================
  // UODATE PROJECT 
  // ===============================
  fastify.put('/:id', {
    preHandler: requireRole(['admin']),
    schema: {
      summary: 'Update project',
      tags: ['Projects'],
      body: {
        type: 'object',
        required: ['name', 'customerId'],
        properties: {
          projectCode: { type: 'string' },
          name: { type: 'string' },
          customerId: { type: 'string' },
          status: { type: 'string' },
          startDate: { type: 'string' },
          endDate: { type: 'string' },
          notes: { type: 'string' }
        }
      }
    }
  }, async (request) => {

    const tenantId = getTenant(request);
    const userId = request.user.userId;
    const { id } = request.params;

    const {
      projectCode,
      name,
      customerId,
      status,
      startDate,
      endDate,
      notes
    } = request.body;

    const result = await appDb.query(`
    UPDATE projects
    SET project_code = $1,
        name = $2,
        customer_id = $3,
        status = $4,
        start_date = $5,
        end_date = $6,
        notes = $7,
        updated_by = $8
    WHERE id = $9
      AND tenant_id = $10
      AND is_active = true
    RETURNING *
  `, [
      projectCode,
      name,
      customerId,
      status,
      startDate,
      endDate,
      notes,
      userId,
      id,
      tenantId
    ]);

    if (result.rowCount === 0) {
      throw new Error('Project not found');
    }

    return {
      success: true,
      data: result.rows[0]
    };
  });

  // ===============================
  // DELETE PROJECT (Soft Delete)
  // ===============================

  fastify.delete('/:id', {
    preHandler: requireRole(['admin']),
    schema: {
      summary: 'Delete project',
      tags: ['Projects']
    }
  }, async (request) => {

    const tenantId = getTenant(request);
    const userId = request.user.userId;
    const { id } = request.params;

    const result = await appDb.query(`
    UPDATE projects
    SET is_active = false,
        deactivated_at = now(),
        deactivated_by = $1
    WHERE id = $2
      AND tenant_id = $3
      AND is_active = true
  `, [userId, id, tenantId]);

    if (result.rowCount === 0) {
      throw new Error('Project not found');
    }

    return {
      success: true
    };
  });

};