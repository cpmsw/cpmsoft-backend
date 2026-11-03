// cpmsoft-api/modules/scheduler/index.js

module.exports = async function (fastify) {

  fastify.register(
    require("./calendar.routes"),
    {
      prefix: "/calendars"
    }
  );

  fastify.register(
    require("./schedule.routes"),
    {
      prefix: "/schedules"
    }
  );

  fastify.register(
    require("./activity.routes"),
    {
      prefix: "/schedules"
    }
  );

  fastify.register(
    require("./relationship.routes"),
    {
      prefix: "/schedules"
    }
  );
};