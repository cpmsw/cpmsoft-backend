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
  fastify.register(
      require(
        "./phones"
      ),
      {
        prefix:
          "/:companyId/phones"
      }
    );


};
