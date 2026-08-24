module.exports =
async function (fastify) {

  fastify.register(
    require(
      "./companyAddresses.routes"
    )
  );

};