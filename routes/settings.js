const appDb = require('../db/appDb');
const { getTenant } = require('../services/tenant');
const requireRole = require('../middleware/requireRole');

module.exports = async function (fastify) {

  // ===============================
  // GET SETTINGS MENU
  // ===============================
fastify.get('/settings/menu', {
  schema: {
    summary: 'Get settings menu',
    tags: ['Settings'],
    response: {
      200: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            label: { type: 'string' },
            type: { type: 'string' },
            optionType: { type: 'string' }
          }
        }
      }
    }
  }
}, async (request) => {

  const tenantId = request.user.tenantId;

  const result = await appDb.query(`
    SELECT
      menu_key AS id,
      label,
      type,
      option_type AS "optionType"
    FROM settings_menu
    WHERE tenant_id = $1
      AND is_active = true
    ORDER BY sort_order
  `, [tenantId]);

  return result.rows;
});

  // ===============================
  // GET DROPDOWN ITEMS
  // ===============================
  fastify.get('/dropdown/:type', async (request) => {

  const tenant = getTenant(request);
  const { type } = request.params;

  const result = await appDb.query(
    `
    SELECT id,
           dropdown_value,
           dropdown_code,
           sort_order,
           flag_delete
    FROM list_dropdowns
    WHERE tenant = $1
      AND dropdown_type = UPPER($2)
    ORDER BY sort_order
    `,
    [tenant, type]
  );

  return result.rows;
});

};
