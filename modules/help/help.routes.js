const service =
  require("cpmsoft-core/help/help.service");

module.exports =
  async function (fastify) {


    // ==================================================
    // GET PUBLISHED HELP BY KEY
    // ==================================================

    fastify.get(
      "/published",
      {
        schema: {
          tags: [
            "Help"
          ],

          summary:
            "Get published Help by Help key",

          querystring: {
            type: "object",

            required: [
              "helpKey"
            ],

            properties: {
              helpKey: {
                type: "string",
                description:
                  "Registered Help key"
              }
            }
          }
        }
      },
      async (
        request,
        reply
      ) => {

        const {
          helpKey
        } = request.query;


        const content =
          await service
            .getPublishedHelpByKey(
              helpKey
            );


        if (!content) {

          return reply
            .code(404)
            .send({
              error:
                "Published Help not found"
            });
        }


        return content;
      }
    );


    // ==================================================
    // GET HELP NAVIGATION BY KEY
    // ==================================================

    fastify.get(
      "/navigation",
      {
        schema: {
          tags: [
            "Help"
          ],

          summary:
            "Get Help navigation by Help key",

          querystring: {
            type: "object",

            required: [
              "helpKey"
            ],

            properties: {
              helpKey: {
                type: "string",
                description:
                  "Registered Help key"
              }
            }
          }
        }
      },
      async (
        request,
        reply
      ) => {

        const {
          helpKey
        } = request.query;


        const navigation =
          await service
            .getHelpNavigationByKey(
              helpKey
            );


        return navigation;
      }
    );


    // ==================================================
    // GET RELATED HELP BY KEY
    // ==================================================

    fastify.get(
      "/related",
      {
        schema: {
          tags: [
            "Help"
          ],

          summary:
            "Get related Help by Help key",

          querystring: {
            type: "object",

            required: [
              "helpKey"
            ],

            properties: {
              helpKey: {
                type: "string",
                description:
                  "Registered Help key"
              }
            }
          }
        }
      },
      async (
        request,
        reply
      ) => {

        const {
          helpKey
        } = request.query;


        return service
          .getRelatedHelpByKey(
            helpKey
          );
      }
    );


    // ==================================================
    // GET HELP MEDIA BY ID
    // ==================================================

    fastify.get(
      "/media/:mediaId",
      {
        schema: {
          tags: [
            "Help"
          ],

          summary:
            "Get Help media by ID",

          params: {
            type: "object",

            required: [
              "mediaId"
            ],

            properties: {
              mediaId: {
                type: "string",
                format: "uuid",
                description:
                  "Help media ID"
              }
            }
          }
        }
      },
      async (
        request,
        reply
      ) => {

        const {
          mediaId
        } = request.params;


        const media =
          await service
            .getSystemMediaById(
              mediaId
            );


        if (!media) {

          return reply
            .code(404)
            .send({
              error:
                "Help media not found"
            });
        }


        return media;
      }
    );

    // ==================================================
    // OPEN SYSTEM HELP MEDIA
    // ==================================================

    fastify.get(
      "/media/:mediaId/open",
      {
        schema: {
          tags: ["Help"],

          summary:
            "Open SYSTEM Help media",

          params: {
            type: "object",

            required: [
              "mediaId"
            ],

            properties: {
              mediaId: {
                type: "string",
                format: "uuid"
              }
            },

            additionalProperties:
              false
          }
        }
      },

      async (request, reply) => {

        try {

          const opened =
            await service
              .openSystemHelpMedia(
                request.params.mediaId
              );


          const media =
            opened.media;

          const result =
            opened.result;


          if (
            result.type ===
            "redirect"
          ) {

            return {
              type:
                "redirect",

              url:
                result.url
            };
          }


          if (
            result.type ===
            "stream"
          ) {

            reply.header(
              "Content-Type",
              media.content_type ||
              "application/octet-stream"
            );


            reply.header(
              "Content-Disposition",
              `inline; filename*=UTF-8''${encodeURIComponent(
                media.original_filename
              )}`
            );


            return reply.send(
              result.stream
            );
          }


          const error =
            new Error(
              "Unsupported Help media open result."
            );

          error.statusCode = 500;
          error.code =
            "HELP_MEDIA_OPEN_RESULT_INVALID";

          throw error;

        } catch (error) {

          request.log.error(error);

          return reply
            .code(
              error.statusCode || 500
            )
            .send({
              code:
                error.code ||
                "HELP_MEDIA_OPEN_FAILED",

              error:
                error.message
            });
        }
      }
    );

  };