module.exports =
  async function (fastify) {

    fastify.register(
      require(
        "./roles.routes"
      )
    );

    fastify.register(
      require(
        "./history"
      ),
      {
        prefix:
          "/:roleId/history"
      }
    );

  };