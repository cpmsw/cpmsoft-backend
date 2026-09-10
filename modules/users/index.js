const historyRoutes =
  require("./history");


module.exports =
  async function (fastify) {

    fastify.register(
      require("./users.routes")
    );


    fastify.register(
      require("./notes"),
      {
        prefix:
          "/:userId/notes"
      }
    );


    fastify.register(
      historyRoutes,
      {
        prefix:
          "/:userId/history"
      }
    );

  };