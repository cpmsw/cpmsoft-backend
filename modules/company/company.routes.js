const service =
  require("cpmsoft-core/company");

const requirePermission =
  require("../../middleware/requirePermission");

module.exports = async function (fastify) {

  // -----------------------------
  // COUNT
  // -----------------------------
  fastify.get("/count", {
    preHandler: [
      requirePermission(
        "company.view"
      )
    ],
    schema: {
      tags: ["Company"],
      summary: "Count companies by status",
      querystring: {
        type: "object",
        properties: {
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

    const status =
      request.query.status || "active";

    const count =
      await service.countCompanies(
        tenantId,
        status
      );

    return { count };
  });


  // -----------------------------
  // LICENSE / ENTITLEMENT LIMITS
  // -----------------------------
  fastify.get("/limits", {
    preHandler: [
      requirePermission(
        "company.view"
      )
    ],
    schema: {
      tags: ["Company"],
      summary: "Get company entitlement and usage"
    }
  }, async (request) => {

    const tenantId =
      request.user.tenantId;

    return service.getLimits(
      tenantId
    );
  });


  // -----------------------------
  // GET COMPANIES
  // -----------------------------
  fastify.get("/", {
    preHandler: [
      requirePermission(
        "company.view"
      )
    ],
    schema: {
      tags: ["Company"],
      summary: "Search companies",
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
      search,
      status = "active"
    } = request.query;

    return service.getCompanies(
      tenantId,
      search,
      status
    );
  });


  // -----------------------------
  // GET ONE
  // Active and inactive companies
  // can both be viewed.
  // -----------------------------
  fastify.get("/:id", {
    preHandler: [
      requirePermission(
        "company.view"
      )
    ],
    schema: {
      tags: ["Company"],
      summary: "Get one company",
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
        "company.create"
      )
    ],
    schema: {
      tags: ["Company"],
      summary: "Create company",
      body: {
        type: "object",
        required: [
          "companyCode",
          "legalName"
        ],
        properties: {
          companyCode: {
            type: "string",
            minLength: 1,
            maxLength: 30
          },
          legalName: {
            type: "string",
            minLength: 1,
            maxLength: 150
          },
          dbaName: {
            type: ["string", "null"],
            maxLength: 150
          },
          taxId: {
            type: ["string", "null"],
            maxLength: 30
          },
          website: {
            type: ["string", "null"],
            maxLength: 255
          },
          logoUrl: {
            type: ["string", "null"],
            maxLength: 500
          },
          defaultCountry: {
            type: ["string", "null"],
            maxLength: 2
          },
          defaultCurrency: {
            type: ["string", "null"],
            maxLength: 3
          },
          defaultTimezone: {
            type: ["string", "null"],
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

    return service.createCompany(
      tenantId,
      userId,
      request.body
    );
  });


  // -----------------------------
  // UPDATE
  // -----------------------------
  fastify.put("/:id", {
    preHandler: [
      requirePermission(
        "company.edit"
      )
    ],
    schema: {
      tags: ["Company"],
      summary: "Update company",
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
          "companyCode",
          "legalName"
        ],
        properties: {
          companyCode: {
            type: "string",
            minLength: 1,
            maxLength: 30
          },
          legalName: {
            type: "string",
            minLength: 1,
            maxLength: 150
          },
          dbaName: {
            type: ["string", "null"],
            maxLength: 150
          },
          taxId: {
            type: ["string", "null"],
            maxLength: 30
          },
          website: {
            type: ["string", "null"],
            maxLength: 255
          },
          logoUrl: {
            type: ["string", "null"],
            maxLength: 500
          },
          defaultCountry: {
            type: ["string", "null"],
            maxLength: 2
          },
          defaultCurrency: {
            type: ["string", "null"],
            maxLength: 3
          },
          defaultTimezone: {
            type: ["string", "null"],
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

    return service.updateCompany(
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
        "company.deactivate"
      )
    ],
    schema: {
      tags: ["Company"],
      summary: "Deactivate company",
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
        "company.edit"
      )
    ],
    schema: {
      tags: ["Company"],
      summary: "Restore company",
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

    return service.restoreCompany(
      tenantId,
      userId,
      id
    );
  });

};
