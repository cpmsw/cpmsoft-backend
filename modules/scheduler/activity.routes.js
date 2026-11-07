// cpmsoft-api/modules/scheduler/activity.routes.js

const scheduler =
  require("cpmsoft-core/scheduler");

const service =
  scheduler.activity;

const requirePermission =
  require("../../middleware/requirePermission");


const activityChangeSchema = {
  type: "object",
  required: ["activityName"],
  properties: {
    parentId: {
      anyOf: [
        { type: "string", format: "uuid" },
        { type: "null" }
      ]
    },
    activityCode: {
      type: ["string", "null"],
      maxLength: 50
    },
    activityName: {
      type: "string",
      minLength: 1,
      maxLength: 200
    },
    description: {
      type: ["string", "null"]
    },
    itemType: {
      type: "string",
      enum: ["TASK", "MILESTONE"],
      default: "TASK"
    },
    durationMinutes: {
      type: "integer",
      minimum: 0,
      default: 0
    },
    percentComplete: {
      type: "number",
      minimum: 0,
      maximum: 100,
      default: 0
    },
    calendarId: {
      anyOf: [
        { type: "string", format: "uuid" },
        { type: "null" }
      ]
    }
  },
  additionalProperties: false
};



module.exports = async function (fastify) {

  // ==================================================
  // GET ACTIVITIES
  // ==================================================

  fastify.get(
    "/:scheduleId/activities",
    {
      preHandler: [
        requirePermission(
          "projects.view"
        )
      ],
      schema: {
        tags: ["Scheduler Activities"],
        summary: "Get schedule activities",
        params: {
          type: "object",
          required: [
            "scheduleId"
          ],
          properties: {
            scheduleId: {
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
        scheduleId
      } = request.params;

      return service.getActivities(
        tenantId,
        scheduleId
      );
    }
  );


  // ==================================================
  // GET ACTIVITY
  // ==================================================

  fastify.get(
    "/:scheduleId/activities/:activityId",
    {
      preHandler: [
        requirePermission(
          "projects.view"
        )
      ],
      schema: {
        tags: ["Scheduler Activities"],
        summary: "Get schedule activity",
        params: {
          type: "object",
          required: [
            "scheduleId",
            "activityId"
          ],
          properties: {
            scheduleId: {
              type: "string",
              format: "uuid"
            },
            activityId: {
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
        scheduleId,
        activityId
      } = request.params;

      return service.getById(
        tenantId,
        scheduleId,
        activityId
      );
    }
  );


  // ==================================================
  // CREATE ACTIVITY
  //
  // sortOrder is deliberately excluded.
  // Core determines the next position.
  //
  // CPM-calculated fields are deliberately excluded.
  // ==================================================

  fastify.post(
    "/:scheduleId/activities",
    {
      preHandler: [
        requirePermission(
          "projects.create"
        )
      ],
      schema: {
        tags: ["Scheduler Activities"],
        summary: "Create schedule activity",
        params: {
          type: "object",
          required: [
            "scheduleId"
          ],
          properties: {
            scheduleId: {
              type: "string",
              format: "uuid"
            }
          }
        },
        body: {
          type: "object",
          required: [
            "activityName"
          ],
          properties: {
            parentId: {
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
            activityCode: {
              type: [
                "string",
                "null"
              ],
              maxLength: 50
            },
            activityName: {
              type: "string",
              minLength: 1,
              maxLength: 200
            },
            description: {
              type: [
                "string",
                "null"
              ]
            },
            itemType: {
              type: "string",
              enum: [
                "TASK",
                "MILESTONE"
              ],
              default: "TASK"
            },
            durationMinutes: {
              type: "integer",
              minimum: 0,
              default: 0
            },
            percentComplete: {
              type: "number",
              minimum: 0,
              maximum: 100,
              default: 0
            },
            calendarId: {
              anyOf: [
                {
                  type: "string",
                  format: "uuid"
                },
                {
                  type: "null"
                }
              ]
            }
          },
          additionalProperties: false
        }
      }
    },
    async (request) => {

      const tenantId =
        request.user.tenantId;

      const userId =
        request.user.userId;

      const {
        scheduleId
      } = request.params;

      return service.createActivity(
        tenantId,
        userId,
        scheduleId,
        request.body
      );
    }
  );


  // ==================================================
  // UPDATE ACTIVITY
  //
  // sortOrder is deliberately excluded.
  //
  // CPM-calculated fields are deliberately excluded.
  // ==================================================

  fastify.put(
    "/:scheduleId/activities/:activityId",
    {
      preHandler: [
        requirePermission(
          "projects.edit"
        )
      ],
      schema: {
        tags: ["Scheduler Activities"],
        summary: "Update schedule activity",
        params: {
          type: "object",
          required: [
            "scheduleId",
            "activityId"
          ],
          properties: {
            scheduleId: {
              type: "string",
              format: "uuid"
            },
            activityId: {
              type: "string",
              format: "uuid"
            }
          }
        },
        body: {
          type: "object",
          required: [
            "activityName"
          ],
          properties: {
            parentId: {
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
            activityCode: {
              type: [
                "string",
                "null"
              ],
              maxLength: 50
            },
            activityName: {
              type: "string",
              minLength: 1,
              maxLength: 200
            },
            description: {
              type: [
                "string",
                "null"
              ]
            },
            itemType: {
              type: "string",
              enum: [
                "TASK",
                "MILESTONE"
              ],
              default: "TASK"
            },
            durationMinutes: {
              type: "integer",
              minimum: 0,
              default: 0
            },
            percentComplete: {
              type: "number",
              minimum: 0,
              maximum: 100,
              default: 0
            },
            calendarId: {
              anyOf: [
                {
                  type: "string",
                  format: "uuid"
                },
                {
                  type: "null"
                }
              ]
            }
          },
          additionalProperties: false
        }
      }
    },
    async (request) => {

      const tenantId =
        request.user.tenantId;

      const userId =
        request.user.userId;

      const {
        scheduleId,
        activityId
      } = request.params;

      return service.updateActivity(
        tenantId,
        userId,
        scheduleId,
        activityId,
        request.body
      );
    }
  );


  // ==================================================
  // PREVIEW ACTIVITY CPM CHANGES
  // ==================================================

  fastify.post(
    "/:scheduleId/activities/:activityId/preview",
    {
      preHandler: [
        requirePermission("projects.edit")
      ],
      schema: {
        tags: ["Scheduler Activities"],
        summary: "Preview activity CPM changes without saving",
        params: {
          type: "object",
          required: ["scheduleId", "activityId"],
          properties: {
            scheduleId: {
              type: "string",
              format: "uuid"
            },
            activityId: {
              type: "string",
              format: "uuid"
            }
          }
        },
        body: activityChangeSchema
      }
    },
    async (request) => {
      const tenantId = request.user.tenantId;
      const userId = request.user.userId;

      const {
        scheduleId,
        activityId
      } = request.params;

      return scheduler.cpmChangePreview.previewActivityUpdate(
        tenantId,
        userId,
        scheduleId,
        activityId,
        request.body
      );
    }
  );

  // ==================================================
  // APPLY ACTIVITY CPM CHANGES
  // ==================================================

  fastify.post(
    "/:scheduleId/activities/:activityId/apply",
    {
      preHandler: [
        requirePermission("projects.edit")
      ],
      schema: {
        tags: ["Scheduler Activities"],
        summary: "Apply activity CPM changes with revision validation",
        params: {
          type: "object",
          required: ["scheduleId", "activityId"],
          properties: {
            scheduleId: {
              type: "string",
              format: "uuid"
            },
            activityId: {
              type: "string",
              format: "uuid"
            }
          }
        },
        body: {
          type: "object",
          required: ["expectedRevision", "changes"],
          properties: {
            expectedRevision: {
              type: "string",
              pattern: "^[0-9]+$"
            },
            changes: activityChangeSchema
          },
          additionalProperties: false
        }
      }
    },
    async (request) => {
      const tenantId = request.user.tenantId;
      const userId = request.user.userId;

      const {
        scheduleId,
        activityId
      } = request.params;

      const {
        expectedRevision,
        changes
      } = request.body;

      return scheduler.cpmChangePreview.applyActivityUpdate(
        tenantId,
        userId,
        scheduleId,
        activityId,
        changes,
        expectedRevision
      );
    }
  );


  // ==================================================
  // DEACTIVATE ACTIVITY
  // ==================================================

  fastify.delete(
    "/:scheduleId/activities/:activityId",
    {
      preHandler: [
        requirePermission(
          "projects.deactivate"
        )
      ],
      schema: {
        tags: ["Scheduler Activities"],
        summary: "Deactivate schedule activity",
        params: {
          type: "object",
          required: [
            "scheduleId",
            "activityId"
          ],
          properties: {
            scheduleId: {
              type: "string",
              format: "uuid"
            },
            activityId: {
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
        scheduleId,
        activityId
      } = request.params;

      return service.softDelete(
        tenantId,
        userId,
        scheduleId,
        activityId
      );
    }
  );


  // ==================================================
  // RESTORE ACTIVITY
  // ==================================================

  fastify.post(
    "/:scheduleId/activities/:activityId/restore",
    {
      preHandler: [
        requirePermission(
          "projects.edit"
        )
      ],
      schema: {
        tags: ["Scheduler Activities"],
        summary: "Restore schedule activity",
        params: {
          type: "object",
          required: [
            "scheduleId",
            "activityId"
          ],
          properties: {
            scheduleId: {
              type: "string",
              format: "uuid"
            },
            activityId: {
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
        scheduleId,
        activityId
      } = request.params;

      return service.restoreActivity(
        tenantId,
        userId,
        scheduleId,
        activityId
      );
    }
  );

};