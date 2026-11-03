const service =
  require("cpmsoft-core/projects");

const requirePermission =
  require("../../middleware/requirePermission");

module.exports = async function (fastify) {

  // -----------------------------
  // COUNT
  // -----------------------------
  fastify.get("/count", {
    preHandler: [
      requirePermission(
        "projects.view"
      )
    ],
    schema: {
      tags: ["Projects"],
      summary: "Count projects by status",
      querystring: {
        type: "object",
        properties: {
          search: {
            type: "string"
          },
          status: {
            type: "string",
            enum: [
              "active",
              "inactive",
              "all"
            ]
          }
        }
      }
    }
  }, async (request) => {

    const tenantId =
      request.user.tenantId;

    const {
      search = "",
      status = "active"
    } = request.query;

    const count =
      await service.countProjects(
        tenantId,
        search,
        status
      );

    return { count };
  });


  // -----------------------------
  // GET PROJECTS
  // -----------------------------
  fastify.get("/", {
    preHandler: [
      requirePermission(
        "projects.view"
      )
    ],
    schema: {
      tags: ["Projects"],
      summary: "Search projects",
      querystring: {
        type: "object",
        properties: {
          search: {
            type: "string"
          },
          status: {
            type: "string",
            enum: [
              "active",
              "inactive",
              "all"
            ]
          },
          page: {
            type: "integer",
            minimum: 1,
            default: 1
          },
          pageSize: {
            type: "integer",
            minimum: 1,
            maximum: 100,
            default: 100
          }
        }
      }
    }
  }, async (request) => {

    const tenantId =
      request.user.tenantId;

    const {
      search,
      status = "active",
      page = 1,
      pageSize = 100
    } = request.query;

    return service.getProjects(
      tenantId,
      search,
      status,
      page,
      pageSize
    );
  });


  // -----------------------------
  // GET ONE
  // Active and inactive projects
  // can both be viewed.
  // -----------------------------
  fastify.get("/:id", {
    preHandler: [
      requirePermission(
        "projects.view"
      )
    ],
    schema: {
      tags: ["Projects"],
      summary: "Get one project",
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


  // -----------------------------
  // CREATE
  // -----------------------------
  fastify.post("/", {
    preHandler: [
      requirePermission(
        "projects.create"
      )
    ],
    schema: {
      tags: ["Projects"],
      summary: "Create project",
      body: {
        type: "object",
        required: [
          "projectNumber",
          "projectName"
        ],
        properties: {
          projectNumber: {
            type: "string",
            minLength: 1,
            maxLength: 50
          },
          projectName: {
            type: "string",
            minLength: 1,
            maxLength: 200
          },
          description: {
            type: ["string", "null"]
          },
          status: {
            type: "string",
            enum: [
              "PLANNING",
              "ACTIVE",
              "ON_HOLD",
              "COMPLETED",
              "CANCELLED"
            ]
          },
          startDate: {
            type: ["string", "null"],
            format: "date"
          },
          targetCompletionDate: {
            type: ["string", "null"],
            format: "date"
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

    return service.createProject(
      tenantId,
      userId,
      request.body
    );
  });


  // -----------------------------
  // UPDATE
  //
  // Project Number is deliberately
  // excluded. It is immutable after
  // project creation.
  // -----------------------------
  fastify.put("/:id", {
    preHandler: [
      requirePermission(
        "projects.edit"
      )
    ],
    schema: {
      tags: ["Projects"],
      summary: "Update project",
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
          "projectName"
        ],
        properties: {
          projectName: {
            type: "string",
            minLength: 1,
            maxLength: 200
          },
          description: {
            type: ["string", "null"]
          },
          status: {
            type: "string",
            enum: [
              "PLANNING",
              "ACTIVE",
              "ON_HOLD",
              "COMPLETED",
              "CANCELLED"
            ]
          },
          startDate: {
            type: ["string", "null"],
            format: "date"
          },
          targetCompletionDate: {
            type: ["string", "null"],
            format: "date"
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

    return service.updateProject(
      tenantId,
      userId,
      id,
      request.body
    );
  });


  // -----------------------------
  // DELETE / DEACTIVATE
  // -----------------------------
  fastify.delete("/:id", {
    preHandler: [
      requirePermission(
        "projects.deactivate"
      )
    ],
    schema: {
      tags: ["Projects"],
      summary: "Deactivate project",
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


  // -----------------------------
  // RESTORE
  // -----------------------------
  fastify.post("/:id/restore", {
    preHandler: [
      requirePermission(
        "projects.edit"
      )
    ],
    schema: {
      tags: ["Projects"],
      summary: "Restore project",
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

    return service.restoreProject(
      tenantId,
      userId,
      id
    );
  });

};
