// cpmsoft-api/modules/scheduler/calendar.routes.js

const scheduler =
  require("cpmsoft-core/scheduler");

const service =
  scheduler.calendar;

const requirePermission =
  require("../../middleware/requirePermission");


module.exports = async function (fastify) {

  // ==================================================
  // GET CALENDARS
  // ==================================================

  fastify.get("/", {
    preHandler: [
      requirePermission(
        "projects.view"
      )
    ],
    schema: {
      tags: ["Scheduler Calendars"],
      summary: "Get scheduling calendars"
    }
  }, async (request) => {

    const tenantId =
      request.user.tenantId;

    return service.getCalendars(
      tenantId
    );
  });


  // ==================================================
  // GET CALENDAR BY ID
  // ==================================================

  fastify.get("/:id", {
    preHandler: [
      requirePermission(
        "projects.view"
      )
    ],
    schema: {
      tags: ["Scheduler Calendars"],
      summary: "Get scheduling calendar",
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
  // CREATE CALENDAR
  // ==================================================

  fastify.post("/", {
    preHandler: [
      requirePermission(
        "projects.create"
      )
    ],
    schema: {
      tags: ["Scheduler Calendars"],
      summary: "Create scheduling calendar",
      body: {
        type: "object",
        required: [
          "calendarCode",
          "calendarName"
        ],
        properties: {
          calendarCode: {
            type: "string",
            minLength: 1,
            maxLength: 50
          },
          calendarName: {
            type: "string",
            minLength: 1,
            maxLength: 150
          },
          description: {
            type: ["string", "null"]
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

    return service.createCalendar(
      tenantId,
      userId,
      request.body
    );
  });


  // ==================================================
  // UPDATE CALENDAR
  //
  // Calendar Code is deliberately excluded.
  // It is immutable after creation.
  // ==================================================

  fastify.put("/:id", {
    preHandler: [
      requirePermission(
        "projects.edit"
      )
    ],
    schema: {
      tags: ["Scheduler Calendars"],
      summary: "Update scheduling calendar",
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
          "calendarName"
        ],
        properties: {
          calendarName: {
            type: "string",
            minLength: 1,
            maxLength: 150
          },
          description: {
            type: ["string", "null"]
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

    return service.updateCalendar(
      tenantId,
      userId,
      id,
      request.body
    );
  });


  // ==================================================
  // DEACTIVATE CALENDAR
  // ==================================================

  fastify.delete("/:id", {
    preHandler: [
      requirePermission(
        "projects.deactivate"
      )
    ],
    schema: {
      tags: ["Scheduler Calendars"],
      summary: "Deactivate scheduling calendar",
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
  // RESTORE CALENDAR
  // ==================================================

  fastify.post("/:id/restore", {
    preHandler: [
      requirePermission(
        "projects.edit"
      )
    ],
    schema: {
      tags: ["Scheduler Calendars"],
      summary: "Restore scheduling calendar",
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

    return service.restoreCalendar(
      tenantId,
      userId,
      id
    );
  });


  // ==================================================
  // GET WORKDAYS
  // ==================================================

  fastify.get("/:id/workdays", {
    preHandler: [
      requirePermission(
        "projects.view"
      )
    ],
    schema: {
      tags: ["Scheduler Calendars"],
      summary: "Get calendar working periods",
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

    return service.getWorkdays(
      tenantId,
      id
    );
  });


  // ==================================================
  // REPLACE WORKDAYS
  // ==================================================

  fastify.put("/:id/workdays", {
    preHandler: [
      requirePermission(
        "projects.edit"
      )
    ],
    schema: {
      tags: ["Scheduler Calendars"],
      summary: "Replace calendar working periods",
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
        type: "array",
        items: {
          type: "object",
          required: [
            "dayOfWeek",
            "periodNumber",
            "startTime",
            "endTime"
          ],
          properties: {
            dayOfWeek: {
              type: "integer",
              minimum: 0,
              maximum: 6
            },
            periodNumber: {
              type: "integer",
              minimum: 1
            },
            startTime: {
              type: "string"
            },
            endTime: {
              type: "string"
            }
          },
          additionalProperties: false
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

    return service.replaceWorkdays(
      tenantId,
      userId,
      id,
      request.body
    );
  });


  // ==================================================
  // GET EXCEPTIONS
  // ==================================================

  fastify.get("/:id/exceptions", {
    preHandler: [
      requirePermission(
        "projects.view"
      )
    ],
    schema: {
      tags: ["Scheduler Calendars"],
      summary: "Get calendar exceptions",
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

    return service.getExceptions(
      tenantId,
      id
    );
  });


  // ==================================================
  // GET EXCEPTION BY ID
  // ==================================================

  fastify.get(
    "/:id/exceptions/:exceptionId",
    {
      preHandler: [
        requirePermission(
          "projects.view"
        )
      ],
      schema: {
        tags: ["Scheduler Calendars"],
        summary: "Get calendar exception",
        params: {
          type: "object",
          required: [
            "id",
            "exceptionId"
          ],
          properties: {
            id: {
              type: "string",
              format: "uuid"
            },
            exceptionId: {
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
        id,
        exceptionId
      } = request.params;

      return service.getExceptionById(
        tenantId,
        id,
        exceptionId
      );
    }
  );


  // ==================================================
  // CREATE EXCEPTION
  // ==================================================

  fastify.post("/:id/exceptions", {
    preHandler: [
      requirePermission(
        "projects.edit"
      )
    ],
    schema: {
      tags: ["Scheduler Calendars"],
      summary: "Create calendar exception",
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
          "exceptionDate",
          "isWorking"
        ],
        properties: {
          exceptionDate: {
            type: "string",
            format: "date"
          },
          exceptionName: {
            type: ["string", "null"],
            maxLength: 150
          },
          isWorking: {
            type: "boolean"
          },
          periods: {
            type: "array",
            items: {
              type: "object",
              required: [
                "periodNumber",
                "startTime",
                "endTime"
              ],
              properties: {
                periodNumber: {
                  type: "integer",
                  minimum: 1
                },
                startTime: {
                  type: "string"
                },
                endTime: {
                  type: "string"
                }
              },
              additionalProperties: false
            }
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

    return service.createException(
      tenantId,
      userId,
      id,
      request.body
    );
  });


  // ==================================================
  // DELETE EXCEPTION
  // ==================================================

  fastify.delete(
    "/:id/exceptions/:exceptionId",
    {
      preHandler: [
        requirePermission(
          "projects.edit"
        )
      ],
      schema: {
        tags: ["Scheduler Calendars"],
        summary: "Delete calendar exception",
        params: {
          type: "object",
          required: [
            "id",
            "exceptionId"
          ],
          properties: {
            id: {
              type: "string",
              format: "uuid"
            },
            exceptionId: {
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

      const userId =
        request.user.userId;

      const {
        id,
        exceptionId
      } = request.params;

      return service.deleteException(
        tenantId,
        userId,
        id,
        exceptionId
      );
    }
  );

};