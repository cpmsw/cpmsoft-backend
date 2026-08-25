const service =
  require(
    "cpmsoft-core/company/phones"
  );

const requirePermission =
  require(
    "../../../middleware/requirePermission"
  );


module.exports =
  async function (fastify) {


    // --------------------------------
    // GET COMPANY PHONES
    // --------------------------------

    fastify.get("/", {

      preHandler: [
        requirePermission(
          "company.view"
        )
      ],

      schema: {
        tags: ["Company Phones"],
        summary:
          "Get company phones"
      }

    }, async (request) => {

      const tenantId =
        request.user.tenantId;

      const {
        companyId
      } = request.params;


      return service.getPhones(
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
        tags: ["Company Phones"],
        summary:
          "Get one company phone"
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

    fastify.post("/", {

      preHandler: [
        requirePermission(
          "company.edit"
        )
      ],

      schema: {
        tags: ["Company Phones"],
        summary:
          "Create company phone",

        body: {
          type: "object",

          required: [
            "phoneType",
            "phoneNumber"
          ],

          properties: {

            phoneType: {
              type: "string"
            },

            phoneNumber: {
              type: "string"
            },

            extension: {
              type: "string"
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


      return service.createPhone(
        tenantId,
        userId,
        companyId,
        request.body
      );

    });


    // --------------------------------
    // UPDATE
    // --------------------------------

    fastify.put("/:id", {

      preHandler: [
        requirePermission(
          "company.edit"
        )
      ],

      schema: {
        tags: ["Company Phones"],
        summary:
          "Update company phone",

        body: {
          type: "object",

          required: [
            "phoneType",
            "phoneNumber"
          ],

          properties: {

            phoneType: {
              type: "string"
            },

            phoneNumber: {
              type: "string"
            },

            extension: {
              type: "string"
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


      return service.updatePhone(
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
        tags: ["Company Phones"],
        summary:
          "Delete company phone"
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


      return service.deletePhone(
        tenantId,
        userId,
        companyId,
        id
      );

    });

  };