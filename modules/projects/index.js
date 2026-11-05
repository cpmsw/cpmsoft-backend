module.exports = async function (fastify) {

  fastify.register(
    require("./projects.routes")
  );

  fastify.register(
    require("./projectsHistory.routes"),
    {
      prefix: "/:projectId/history"
    }
  );

};