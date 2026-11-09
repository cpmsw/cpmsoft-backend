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

  // ==================================================
  // SCHEDULER BATCH PREVIEW AND SAVE
  // ==================================================

  fastify.register(
    require("./batch.routes"),
    {
      prefix: "/schedules"
    }
  );

  // ==================================================
  // SCHEDULER HISTORY
  // ==================================================

  fastify.register(
    require("./schedulerHistory.routes"),
    {
      prefix: "/schedules"
    }
  );
};
