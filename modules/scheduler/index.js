// cpmsoft-api/modules/scheduler/index.js

module.exports = async function (fastify) {

  fastify.register(
    require("./calendar.routes"),
    {
      prefix: "/calendars"
    }
  );

};