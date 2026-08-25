const service =
  require(
    "cpmsoft-core/company/emails"
  );

const requirePermission =
  require(
    "../../../middleware/requirePermission"
  );


module.exports =
  async function (fastify) {


    // --------------------------------
    // GET COMPANY EMAILS
    // --------------------------------

    fastify.get("/", {

      preHandler: [
        requirePermission(
          "company.view"
        )
      ],

      schema: {
        tags: ["Company Emails"],
        summary:
          "Get company emails"
      }

    }, async (request) => {

      const tenantId =
        request.user.tenantId;

      const {
        companyId
      } = request.params;


      return service.getEmails(
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
        tags: ["Company Emails"],
        summary:
          "Get one company email"
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
        tags: ["Company Emails"],
        summary:
          "Create company email",

        body: {
          type: "object",

          required: [
            "emailType",
            "emailAddress"
          ],

          properties: {

            emailType: {
              type: "string"
            },

            emailAddress: {
              type: "string",
              maxLength: 150
            },

            notes: {
              type: "string",
              maxLength: 250
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


      return service.createEmail(
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
        tags: ["Company Emails"],
        summary:
          "Update company email",

        body: {
          type: "object",

          required: [
            "emailType",
            "emailAddress"
          ],

          properties: {

            emailType: {
              type: "string"
            },

            emailAddress: {
              type: "string",
              maxLength: 150
            },

            notes: {
              type: "string",
              maxLength: 250
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


      return service.updateEmail(
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
        tags: ["Company Emails"],
        summary:
          "Delete company email"
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


      return service.deleteEmail(
        tenantId,
        userId,
        companyId,
        id
      );

    });

  };