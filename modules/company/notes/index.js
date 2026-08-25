module.exports =
  async function (fastify) {

    fastify.register(
      require(
        "./companyNotes.routes"
      )
    );

  };