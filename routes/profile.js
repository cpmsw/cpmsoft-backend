const db = require('../db/authDb');
const verifyToken = require('../middleware/verifyToken');

module.exports = async function profileRoutes(fastify) {

  // -----------------------------
  // UPDATE PROFILE INFO
  // -----------------------------
  fastify.put('/profile', {
    preHandler: verifyToken
  }, async (request, reply) => {

    const { firstname, lastname } = request.body;

    await db.query(
      `UPDATE users
       SET firstname = $1,
           lastname = $2
       WHERE id = $3`,
      [firstname, lastname, request.user.userId]
    );

    return { success: true };
  });

  // -----------------------------
  // UPDATE THEME
  // -----------------------------
fastify.put('/profile/theme', {
  preHandler: verifyToken,
  schema: {
    summary: 'Update user theme preferences',
    tags: ['Profile'],
    security: [{ bearerAuth: [] }],
    body: {
      type: 'object',
      required: ['themeMode', 'accentTheme'],
      properties: {
        themeMode: { type: 'string' },
        accentTheme: { type: 'string' }
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
}, async (request, reply) => {

  const { themeMode, accentTheme } = request.body;

  console.log("THEME UPDATE BODY:", request.body);
  console.log("USER ID:", request.user.userId);

  await db.query(
    `UPDATE users
     SET theme_mode = $1,
         accent_theme = $2
     WHERE id = $3`,
    [themeMode, accentTheme, request.user.userId]
  );

  return { success: true };
});


};
