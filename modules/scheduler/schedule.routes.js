// cpmsoft-api/modules/scheduler/schedule.routes.js

const scheduler =
  require("cpmsoft-core/scheduler");

const service =
  scheduler.schedule;

const requirePermission =
  require("../../middleware/requirePermission");


module.exports = async function (fastify) {

  // ==================================================
  // GET SCHEDULES
  // ==================================================

  fastify.get("/", {
    preHandler: [
      requirePermission(
        "projects.view"
      )
    ],
    schema: {
      tags: ["Scheduler Schedules"],
      summary: "Get schedules"
    }
  }, async (request) => {

    const tenantId =
      request.user.tenantId;

    return service.getSchedules(
      tenantId
    );
  });


  // ==================================================
  // GET SCHEDULES BY REFERENCE
  // ==================================================

  fastify.get(
    "/by-reference/:referenceType/:referenceId",
    {
      preHandler: [
        requirePermission(
          "projects.view"
        )
      ],
      schema: {
        tags: ["Scheduler Schedules"],
        summary:
          "Get schedules by reference",
        params: {
          type: "object",
          required: [
            "referenceType",
            "referenceId"
          ],
          properties: {
            referenceType: {
              type: "string",
              minLength: 1,
              maxLength: 50
            },
            referenceId: {
              type: "string",
              format: "uuid"
            }
          }
        }
      }
    },
    async (request) => {

      const tenantId =
        request.user.tenantId;

      const {
        referenceType,
        referenceId
      } = request.params;

      return service.getByReference(
        tenantId,
        referenceType,
        referenceId
      );
    }
  );


  // ==================================================
  // GET SCHEDULE BY ID
  // ==================================================

  fastify.get("/:id", {
    preHandler: [
      requirePermission(
        "projects.view"
      )
    ],
    schema: {
      tags: ["Scheduler Schedules"],
      summary: "Get schedule",
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: {
            type: "string",
            format: "uuid"
          }
        }
      }
    }
  }, async (request) => {

    const tenantId =
      request.user.tenantId;

    const { id } =
      request.params;

    return service.getById(
      tenantId,
      id
    );
  });


  // ==================================================
  // CREATE SCHEDULE
  // ==================================================

  fastify.post("/", {
    preHandler: [
      requirePermission(
        "projects.create"
      )
    ],
    schema: {
      tags: ["Scheduler Schedules"],
      summary: "Create schedule",
      body: {
        type: "object",
        required: [
          "scheduleName",
          "scheduleStart",
          "defaultCalendarId",
          "timeZone"
        ],
        properties: {
          scheduleNumber: {
            type: ["string", "null"],
            maxLength: 50
          },
          scheduleName: {
            type: "string",
            minLength: 1,
            maxLength: 200
          },
          description: {
            type: ["string", "null"]
          },
          referenceType: {
            type: ["string", "null"],
            maxLength: 50
          },
          referenceId: {
            anyOf: [
              {
                type: "string",
                format: "uuid"
              },
              {
                type: "null"
              }
            ]
          },
          status: {
            type: "string",
            enum: [
              "DRAFT",
              "ACTIVE",
              "ARCHIVED"
            ],
            default: "DRAFT"
          },
          scheduleStart: {
            type: "string",
            format: "date-time"
          },
          dataDate: {
            type: ["string", "null"],
            format: "date"
          },
          defaultCalendarId: {
            type: "string",
            format: "uuid"
          },
          timeZone: {
            type: "string",
            minLength: 1,
            maxLength: 100
          }
        },
        additionalProperties: false
      }
    }
  }, async (request) => {

    const tenantId =
      request.user.tenantId;

    const userId =
      request.user.userId;

    return service.createSchedule(
      tenantId,
      userId,
      request.body
    );
  });


  // ==================================================
  // UPDATE SCHEDULE
  //
  // Schedule Number is deliberately excluded.
  // It is immutable after creation.
  // ==================================================

  fastify.put("/:id", {
    preHandler: [
      requirePermission(
        "projects.edit"
      )
    ],
    schema: {
      tags: ["Scheduler Schedules"],
      summary: "Update schedule",
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: {
            type: "string",
            format: "uuid"
          }
        }
      },
      body: {
        type: "object",
        required: [
          "scheduleName",
          "scheduleStart",
          "defaultCalendarId",
          "timeZone"
        ],
        properties: {
          scheduleName: {
            type: "string",
            minLength: 1,
            maxLength: 200
          },
          description: {
            type: ["string", "null"]
          },
          referenceType: {
            type: ["string", "null"],
            maxLength: 50
          },
          referenceId: {
            anyOf: [
              {
                type: "string",
                format: "uuid"
              },
              {
                type: "null"
              }
            ]
          },
          status: {
            type: "string",
            enum: [
              "DRAFT",
              "ACTIVE",
              "ARCHIVED"
            ],
            default: "DRAFT"
          },
          scheduleStart: {
            type: "string",
            format: "date-time"
          },
          dataDate: {
            type: ["string", "null"],
            format: "date"
          },
          defaultCalendarId: {
            type: "string",
            format: "uuid"
          },
          timeZone: {
            type: "string",
            minLength: 1,
            maxLength: 100
          }
        },
        additionalProperties: false
      }
    }
  }, async (request) => {

    const tenantId =
      request.user.tenantId;

    const userId =
      request.user.userId;

    const { id } =
      request.params;

    return service.updateSchedule(
      tenantId,
      userId,
      id,
      request.body
    );
  });


  // ==================================================
  // DEACTIVATE SCHEDULE
  // ==================================================

  fastify.delete("/:id", {
    preHandler: [
      requirePermission(
        "projects.deactivate"
      )
    ],
    schema: {
      tags: ["Scheduler Schedules"],
      summary: "Deactivate schedule",
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: {
            type: "string",
            format: "uuid"
          }
        }
      }
    }
  }, async (request) => {

    const tenantId =
      request.user.tenantId;

    const userId =
      request.user.userId;

    const { id } =
      request.params;

    return service.softDelete(
      tenantId,
      userId,
      id
    );
  });


  // ==================================================
  // RESTORE SCHEDULE
  // ==================================================

  fastify.post("/:id/restore", {
    preHandler: [
      requirePermission(
        "projects.edit"
      )
    ],
    schema: {
      tags: ["Scheduler Schedules"],
      summary: "Restore schedule",
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: {
            type: "string",
            format: "uuid"
          }
        }
      }
    }
  }, async (request) => {

    const tenantId =
      request.user.tenantId;

    const userId =
      request.user.userId;

    const { id } =
      request.params;

    return service.restoreSchedule(
      tenantId,
      userId,
      id
    );
  });

};