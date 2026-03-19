const appDb = require('../../db/appDb');
const { getTenant } = require('../../services/tenant');
const requireRole = require('../../middleware/requireRole');

module.exports = async function (fastify) {

  // =====================================================
  // GET LINES
  // =====================================================
  fastify.get('/:projectId/lines', {
    schema: {
      summary: 'Get project budget lines',
      tags: ['Project Lines'],
      params: {
        type: 'object',
        required: ['projectId'],
        properties: {
          projectId: { type: 'string', format: 'uuid' }
        }
      },
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
                  lineNumber: { type: 'number' },
                  partNumber: { type: 'string' },
                  description: { type: 'string' },
                  quantity: { type: 'number' },
                  unitCost: { type: 'number' },
                  totalCost: { type: 'number' },
                  notes: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  }, async (request) => {

    const tenantId = getTenant(request);
    const { projectId } = request.params;

    const result = await appDb.query(`
      SELECT *
      FROM budget_lines
      WHERE tenant_id = $1
        AND project_id = $2
        AND is_active = true
      ORDER BY line_number
    `, [tenantId, projectId]);

    const data = result.rows.map(r => ({
      id: r.id,
      lineNumber: r.line_number,
      partNumber: r.part_number,
      description: r.description,
      quantity: r.quantity,
      unitCost: r.unit_cost,
      totalCost: r.total_cost,
      notes: r.notes
    }));

    return { success: true, data };
  });


  // =====================================================
  // CREATE LINE
  // =====================================================
  fastify.post('/:projectId/lines', {
    preHandler: requireRole(['admin']),
    schema: {
      summary: 'Create budget line',
      tags: ['Project Lines'],
      params: {
        type: 'object',
        required: ['projectId'],
        properties: {
          projectId: { type: 'string', format: 'uuid' }
        }
      },
      body: {
        type: 'object',
        required: ['lineNumber', 'description'],
        properties: {
          lineNumber: { type: 'number' },
          partNumber: { type: 'string' },
          description: { type: 'string' },
          quantity: { type: 'number' },
          unitCost: { type: 'number' },
          notes: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' }
          }
        }
      }
    }
  }, async (request) => {

    const tenantId = getTenant(request);
    const userId = request.user.userId;
    const { projectId } = request.params;

    const {
      lineNumber,
      partNumber,
      description,
      quantity,
      unitCost,
      notes
    } = request.body;

    const totalCost = (quantity || 0) * (unitCost || 0);

    const result = await appDb.query(`
      INSERT INTO budget_lines (
        tenant_id,
        project_id,
        line_number,
        part_number,
        description,
        quantity,
        unit_cost,
        total_cost,
        notes,
        created_by
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *
    `, [
      tenantId,
      projectId,
      lineNumber,
      partNumber,
      description,
      quantity,
      unitCost,
      totalCost,
      notes,
      userId
    ]);

    return { success: true, data: result.rows[0] };
  });


  // =====================================================
  // UPDATE LINE
  // =====================================================
  fastify.put('/:projectId/lines/:lineId', {
    preHandler: requireRole(['admin']),
    schema: {
      summary: 'Update budget line',
      tags: ['Project Lines'],
      params: {
        type: 'object',
        required: ['projectId', 'lineId'],
        properties: {
          projectId: { type: 'string', format: 'uuid' },
          lineId: { type: 'string', format: 'uuid' }
        }
      },
      body: {
        type: 'object',
        properties: {
          partNumber: { type: 'string' },
          description: { type: 'string' },
          quantity: { type: 'number' },
          unitCost: { type: 'number' },
          notes: { type: 'string' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object' }
          }
        }
      }
    }
  }, async (request) => {

    const tenantId = getTenant(request);
    const userId = request.user.userId;
    const { projectId, lineId } = request.params;

    const {
      partNumber,
      description,
      quantity,
      unitCost,
      notes
    } = request.body;

    const totalCost = (quantity || 0) * (unitCost || 0);

    const result = await appDb.query(`
      UPDATE budget_lines
      SET part_number = $1,
          description = $2,
          quantity = $3,
          unit_cost = $4,
          total_cost = $5,
          notes = $6,
          updated_by = $7
      WHERE id = $8
        AND project_id = $9
        AND tenant_id = $10
        AND is_active = true
      RETURNING *
    `, [
      partNumber,
      description,
      quantity,
      unitCost,
      totalCost,
      notes,
      userId,
      lineId,
      projectId,
      tenantId
    ]);

    return { success: true, data: result.rows[0] };
  });


  // =====================================================
  // DELETE LINE
  // =====================================================
  fastify.delete('/:projectId/lines/:lineId', {
    preHandler: requireRole(['admin']),
    schema: {
      summary: 'Delete budget line',
      tags: ['Project Lines'],
      params: {
        type: 'object',
        required: ['projectId', 'lineId'],
        properties: {
          projectId: { type: 'string', format: 'uuid' },
          lineId: { type: 'string', format: 'uuid' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' }
          }
        }
      }
    }
  }, async (request) => {

    const tenantId = getTenant(request);
    const userId = request.user.userId;
    const { projectId, lineId } = request.params;

    await appDb.query(`
      UPDATE budget_lines
      SET is_active = false,
          deactivated_at = now(),
          deactivated_by = $1
      WHERE id = $2
        AND project_id = $3
        AND tenant_id = $4
    `, [userId, lineId, projectId, tenantId]);

    return { success: true };
  });

};