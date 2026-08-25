const notesService =
  require(
    "cpmsoft-core/notes"
  );

const requirePermission =
  require(
    "../../../middleware/requirePermission"
  );


const PARENT_TYPE =
  "company";


module.exports =
  async function (fastify) {


    // ================================================
    // GET COMPANY NOTES
    // ================================================

    fastify.get("/", {

      preHandler: [
        requirePermission(
          "company.view"
        )
      ],

      schema: {
        tags: ["Company Notes"],
        summary:
          "Get company notes"
      }

    }, async (request) => {

      const tenantId =
        request.user.tenantId;

      const {
        companyId
      } = request.params;


      return notesService.getNotes(
        tenantId,
        PARENT_TYPE,
        companyId
      );

    });


    // ================================================
    // CREATE
    // ================================================

    fastify.post("/", {

      preHandler: [
        requirePermission(
          "company.edit"
        )
      ],

      schema: {

        tags: ["Company Notes"],

        summary:
          "Create company note",

        body: {
          type: "object",

          required: [
            "notesRef",
            "notes"
          ],

          properties: {

            notesRef: {
              type: "string",
              maxLength: 100
            },

            notes: {
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


      return notesService.createNote(
        tenantId,
        PARENT_TYPE,
        companyId,
        userId,
        request.body
      );

    });


    // ================================================
    // UPDATE
    // ================================================

    fastify.put("/:noteId", {

      preHandler: [
        requirePermission(
          "company.edit"
        )
      ],

      schema: {

        tags: ["Company Notes"],

        summary:
          "Update company note",

        body: {
          type: "object",

          required: [
            "notesRef",
            "notes"
          ],

          properties: {

            notesRef: {
              type: "string",
              maxLength: 100
            },

            notes: {
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
        noteId
      } = request.params;


      return notesService.updateNote(
        tenantId,
        noteId,
        userId,
        request.body
      );

    });


    // ================================================
    // DELETE
    // ================================================

    fastify.delete("/:noteId", {

      preHandler: [
        requirePermission(
          "company.edit"
        )
      ],

      schema: {
        tags: ["Company Notes"],
        summary:
          "Delete company note"
      }

    }, async (request) => {

      const tenantId =
        request.user.tenantId;

      const userId =
        request.user.userId;

      const {
        noteId
      } = request.params;


      return notesService.deleteNote(
        tenantId,
        noteId,
        userId
      );

    });

  };