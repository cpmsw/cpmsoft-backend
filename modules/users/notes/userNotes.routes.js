const notesService =
  require(
    "cpmsoft-core/notes"
  );

const requirePermission =
  require(
    "../../../middleware/requirePermission"
  );

const PARENT_TYPE =
  "user";


module.exports =
  async function (fastify) {


    // ================================================
    // GET USER NOTES
    // ================================================

    fastify.get("/", {

      preHandler: [
        requirePermission(
          "users.view"
        )
      ],

      schema: {
        tags: ["User Notes"],
        summary:
          "Get user notes"
      }

    }, async (request) => {

      const tenantId =
        request.user.tenantId;

      const {
        userId
      } = request.params;


      return notesService.getNotes(
        tenantId,
        PARENT_TYPE,
        userId
      );

    });


    // ================================================
    // CREATE
    // ================================================

    fastify.post("/", {

      preHandler: [
        requirePermission(
          "users.edit"
        )
      ],

      schema: {

        tags: ["User Notes"],

        summary:
          "Create user note",

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

      const changedBy =
        request.user.userId;

      const {
        userId
      } = request.params;


      return notesService.createNote(
        tenantId,
        PARENT_TYPE,
        userId,
        changedBy,
        request.body
      );

    });


    // ================================================
    // UPDATE
    // ================================================

    fastify.put("/:noteId", {

      preHandler: [
        requirePermission(
          "users.edit"
        )
      ],

      schema: {

        tags: ["User Notes"],

        summary:
          "Update user note",

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

      const changedBy =
        request.user.userId;

      const {
        noteId
      } = request.params;


      return notesService.updateNote(
        tenantId,
        noteId,
        changedBy,
        request.body
      );

    });


    // ================================================
    // DELETE
    // ================================================

    fastify.delete("/:noteId", {

      preHandler: [
        requirePermission(
          "users.edit"
        )
      ],

      schema: {
        tags: ["User Notes"],
        summary:
          "Delete user note"
      }

    }, async (request) => {

      const tenantId =
        request.user.tenantId;

      const changedBy =
        request.user.userId;

      const {
        noteId
      } = request.params;


      return notesService.deleteNote(
        tenantId,
        noteId,
        changedBy
      );

    });

  };