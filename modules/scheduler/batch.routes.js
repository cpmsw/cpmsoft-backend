
"use strict";

// cpmsoft-api/modules/scheduler/batch.routes.js

const scheduler =
  require("cpmsoft-core/scheduler");

const service =
  scheduler.cpmBatchChange;

const requirePermission =
  require("../../middleware/requirePermission");

const batchBodySchema = {
  type: "object",
  required: [
    "expectedRevision",
    "changeSet"
  ],
  properties: {
    expectedRevision: {
      type: "integer",
      minimum: 0
    },
    changeSet: {
      type: "object",
      required: [
        "activities",
        "relationships"
      ],
      properties: {
        activities: {
          type: "object",
          required: [
            "added",
            "modified",
            "deleted"
          ],
          properties: {
            added: {
              type: "array",
              items: { type: "object" }
            },
            modified: {
              type: "array",
              items: { type: "object" }
            },
            deleted: {
              type: "array",
              items: { type: "object" }
            }
          },
          additionalProperties: false
        },
        relationships: {
          type: "object",
          required: [
            "added",
            "modified",
            "deleted"
          ],
          properties: {
            added: {
              type: "array",
              items: { type: "object" }
            },
            modified: {
              type: "array",
              items: { type: "object" }
            },
            deleted: {
              type: "array",
              items: { type: "object" }
            }
          },
          additionalProperties: false
        }
      },
      additionalProperties: false
    },
    previewToken: {
      type: "string",
      minLength: 1,
      maxLength: 8192
    }
  },
  additionalProperties: false
};

module.exports = async function (fastify) {

  // ==================================================
  // BATCH PREVIEW
  // ==================================================

  fastify.post("/:id/batch/preview", {
    preHandler: [
      requirePermission("projects.edit")
    ],
    schema: {
      tags: ["Scheduler Batch"],
      summary:
        "Preview schedule batch changes without saving",
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
      body: batchBodySchema
    }
  }, async (request) => {

    const tenantId =
      request.user.tenantId;

    const userId =
      request.user.userId;

    const scheduleId =
      request.params.id;

    const {
      expectedRevision,
      changeSet
    } = request.body;

    return service.previewBatchChanges({
      tenantId,
      userId,
      scheduleId,
      expectedRevision,
      changeSet
    });
  });

  // ==================================================
  // BATCH SAVE
  // ==================================================

  fastify.post("/:id/batch/save", {
    preHandler: [
      requirePermission("projects.edit")
    ],
    schema: {
      tags: ["Scheduler Batch"],
      summary:
        "Save previously previewed schedule batch changes",
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
        ...batchBodySchema,
        required: [
          "expectedRevision",
          "changeSet",
          "previewToken"
        ]
      }
    }
  }, async (request) => {

    const tenantId =
      request.user.tenantId;

    const userId =
      request.user.userId;

    const scheduleId =
      request.params.id;

    const {
      expectedRevision,
      changeSet,
      previewToken
    } = request.body;

    return service.applyBatchChanges({
      tenantId,
      userId,
      scheduleId,
      expectedRevision,
      changeSet,
      previewToken
    });
  });

};
