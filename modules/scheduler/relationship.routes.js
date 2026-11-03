// cpmsoft-api/modules/scheduler/relationship.routes.js

const scheduler =
  require("cpmsoft-core/scheduler");

const service =
  scheduler.relationship;

const requirePermission =
  require("../../middleware/requirePermission");


module.exports = async function (fastify) {

  // ==================================================
  // GET RELATIONSHIPS
  // ==================================================

  fastify.get(
    "/:scheduleId/relationships",
    {
      preHandler: [
        requirePermission(
          "projects.view"
        )
      ],
      schema: {
        tags: ["Scheduler Relationships"],
        summary: "Get schedule relationships",
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

      return service.getRelationships(
        tenantId,
        scheduleId
      );
    }
  );


  // ==================================================
  // GET RELATIONSHIP
  // ==================================================

  fastify.get(
    "/:scheduleId/relationships/:relationshipId",
    {
      preHandler: [
        requirePermission(
          "projects.view"
        )
      ],
      schema: {
        tags: ["Scheduler Relationships"],
        summary: "Get schedule relationship",
        params: {
          type: "object",
          required: [
            "scheduleId",
            "relationshipId"
          ],
          properties: {
            scheduleId: {
              type: "string",
              format: "uuid"
            },
            relationshipId: {
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
        relationshipId
      } = request.params;

      return service.getById(
        tenantId,
        scheduleId,
        relationshipId
      );
    }
  );


  // ==================================================
  // CREATE RELATIONSHIP
  //
  // lagMinutes is signed:
  //
  // positive = lag
  // negative = lead
  //
  // Core validates:
  // - same tenant/schedule
  // - active activities
  // - no summaries
  // - no self relationship
  // - duplicate relationship
  // - dependency cycles
  // ==================================================

  fastify.post(
    "/:scheduleId/relationships",
    {
      preHandler: [
        requirePermission(
          "projects.create"
        )
      ],
      schema: {
        tags: ["Scheduler Relationships"],
        summary: "Create schedule relationship",
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
            "predecessorActivityId",
            "successorActivityId",
            "relationshipType"
          ],
          properties: {
            predecessorActivityId: {
              type: "string",
              format: "uuid"
            },
            successorActivityId: {
              type: "string",
              format: "uuid"
            },
            relationshipType: {
              type: "string",
              enum: [
                "FS",
                "SS",
                "FF",
                "SF"
              ]
            },
            lagMinutes: {
              type: "integer",
              default: 0
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

      return service.createRelationship(
        tenantId,
        userId,
        scheduleId,
        request.body
      );
    }
  );


  // ==================================================
  // UPDATE RELATIONSHIP
  //
  // The complete relationship definition is supplied.
  //
  // Core revalidates the resulting dependency graph
  // before saving the change.
  // ==================================================

  fastify.put(
    "/:scheduleId/relationships/:relationshipId",
    {
      preHandler: [
        requirePermission(
          "projects.edit"
        )
      ],
      schema: {
        tags: ["Scheduler Relationships"],
        summary: "Update schedule relationship",
        params: {
          type: "object",
          required: [
            "scheduleId",
            "relationshipId"
          ],
          properties: {
            scheduleId: {
              type: "string",
              format: "uuid"
            },
            relationshipId: {
              type: "string",
              format: "uuid"
            }
          }
        },
        body: {
          type: "object",
          required: [
            "predecessorActivityId",
            "successorActivityId",
            "relationshipType"
          ],
          properties: {
            predecessorActivityId: {
              type: "string",
              format: "uuid"
            },
            successorActivityId: {
              type: "string",
              format: "uuid"
            },
            relationshipType: {
              type: "string",
              enum: [
                "FS",
                "SS",
                "FF",
                "SF"
              ]
            },
            lagMinutes: {
              type: "integer",
              default: 0
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
        relationshipId
      } = request.params;

      return service.updateRelationship(
        tenantId,
        userId,
        scheduleId,
        relationshipId,
        request.body
      );
    }
  );


  // ==================================================
  // DELETE RELATIONSHIP
  //
  // Relationships are removed permanently.
  // There is no inactive/restore lifecycle because
  // they represent current scheduling logic.
  // ==================================================

  fastify.delete(
    "/:scheduleId/relationships/:relationshipId",
    {
      preHandler: [
        requirePermission(
          "projects.edit"
        )
      ],
      schema: {
        tags: ["Scheduler Relationships"],
        summary: "Delete schedule relationship",
        params: {
          type: "object",
          required: [
            "scheduleId",
            "relationshipId"
          ],
          properties: {
            scheduleId: {
              type: "string",
              format: "uuid"
            },
            relationshipId: {
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
        relationshipId
      } = request.params;

      return service.deleteRelationship(
        tenantId,
        userId,
        scheduleId,
        relationshipId
      );
    }
  );
};