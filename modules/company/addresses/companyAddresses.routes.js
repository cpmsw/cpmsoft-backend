const service =
  require(
    "cpmsoft-core/company/addresses"
  );

const requirePermission =
  require(
    "../../../middleware/requirePermission"
  );


module.exports =
  async function (fastify) {


    // --------------------------------
    // GET COMPANY ADDRESSES
    // --------------------------------

    fastify.get("/", {

      preHandler: [
        requirePermission(
          "company.view"
        )
      ],

      schema: {
        tags: ["Company Addresses"],
        summary:
          "Get company addresses"
      }

    }, async (request) => {

      const tenantId =
        request.user.tenantId;

      const {
        companyId
      } = request.params;

      return service.getAddresses(
        tenantId,
        companyId
      );

    });


    // --------------------------------
    // GET ONE
    // --------------------------------

    fastify.get("/:id", {

      preHandler: [
        requirePermission(
          "company.view"
        )
      ],

      schema: {
        tags: ["Company Addresses"],
        summary: "Get one company address"
      }

    }, async (request) => {

      const tenantId =
        request.user.tenantId;

      const {
        companyId,
        id
      } = request.params;

      return service.getById(
        tenantId,
        companyId,
        id
      );

    });


    // --------------------------------
    // CREATE
    // --------------------------------

    // --------------------------------
    // CREATE COMPANY ADDRESS
    // --------------------------------

    fastify.post("/", {

      preHandler: [
        requirePermission(
          "company.edit"
        )
      ],

      schema: {
        tags: ["Company Addresses"],
        summary: "Create company address",

        body: {
          type: "object",
          required: [
            "addressType",
            "address1"
          ],
          properties: {
            addressType: {
              type: "string"
            },
            address1: {
              type: "string"
            },
            address2: {
              type: "string"
            },
            city: {
              type: "string"
            },
            state: {
              type: "string"
            },
            postalCode: {
              type: "string"
            },
            country: {
              type: "string"
            },
            isPrimary: {
              type: "boolean"
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

      const {
        companyId
      } = request.params;

      return service.createAddress(
        tenantId,
        userId,
        companyId,
        request.body
      );

    });

    // --------------------------------
    // UPDATE
    // --------------------------------

    // --------------------------------
    // UPDATE COMPANY ADDRESS
    // --------------------------------

    fastify.put("/:id", {

      preHandler: [
        requirePermission(
          "company.edit"
        )
      ],

      schema: {
        tags: ["Company Addresses"],
        summary: "Update company address",

        body: {
          type: "object",

          required: [
            "addressType",
            "address1"
          ],

          properties: {

            addressType: {
              type: "string"
            },

            address1: {
              type: "string"
            },

            address2: {
              type: "string"
            },

            city: {
              type: "string"
            },

            state: {
              type: "string"
            },

            postalCode: {
              type: "string"
            },

            country: {
              type: "string"
            },

            isPrimary: {
              type: "boolean"
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

      const {
        companyId,
        id
      } = request.params;

      return service.updateAddress(
        tenantId,
        userId,
        companyId,
        id,
        request.body
      );

    });

    // --------------------------------
    // DELETE
    // --------------------------------

    fastify.delete("/:id", {

      preHandler: [
        requirePermission(
          "company.edit"
        )
      ],

      schema: {
        tags: ["Company Addresses"],
        summary: "Delete company address"
      }

    }, async (request) => {

      const tenantId =
        request.user.tenantId;

      const userId =
        request.user.userId;

      const {
        companyId,
        id
      } = request.params;

      return service.softDelete(
        tenantId,
        userId,
        companyId,
        id
      );

    });

  };