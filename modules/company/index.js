module.exports = async function (fastify) {
  fastify.register(
    require("./company.routes")
  );
  fastify.register(
    require("./addresses"),
    {
      prefix:
        "/:companyId/addresses"
    }
  );

};
