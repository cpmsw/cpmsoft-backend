module.exports =
  async function (fastify) {

    fastify.register(
      require(
        "./companyPhones.routes"
      )
    );

  };