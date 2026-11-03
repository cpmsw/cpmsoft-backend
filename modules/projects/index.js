module.exports = async function (fastify) {
  fastify.register(
    require("./projects.routes")
  );
};