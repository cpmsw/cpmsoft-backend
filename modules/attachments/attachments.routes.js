const fs =
  require("fs");

const fsPromises =
  require("fs/promises");

const os =
  require("os");

const path =
  require("path");

const crypto =
  require("crypto");

const {
  pipeline
} =
  require("stream/promises");


const service =
  require("cpmsoft-core/attachments");

function toPublicAttachment(attachment) {
  if (!attachment) {
    return null;
  }

  return {
    id: attachment.id,
    parent_type: attachment.parent_type,
    parent_id: attachment.parent_id,
    category: attachment.category,
    original_filename: attachment.original_filename,
    content_type: attachment.content_type,
    file_size_bytes: attachment.file_size_bytes,
    created_by: attachment.created_by,
    created_at: attachment.created_at,
    updated_by: attachment.updated_by,
    updated_at: attachment.updated_at
  };
}

module.exports =
  async function (fastify) {


    // ==================================================
    // GET ATTACHMENTS FOR PARENT
    // ==================================================

    fastify.get(
      "/:parentType/:parentId",
      {
        schema: {
          tags: [
            "Attachments"
          ],

          summary:
            "Get attachments for a parent record",

          params: {
            type: "object",

            required: [
              "parentType",
              "parentId"
            ],

            properties: {

              parentType: {
                type: "string",

                enum: [
                  "user",
                  "project",
                  "company"
                ]
              },

              parentId: {
                type: "string",
                format: "uuid"
              }
            },

            additionalProperties:
              false
          }
        }
      },

      async (request) => {

        const tenantId =
          request.user.tenantId;


        const {
          parentType,
          parentId
        } =
          request.params;


        const attachments =
          await service.getAttachments(
            tenantId,
            parentType,
            parentId
          );

        return attachments.map(toPublicAttachment);
      }
    );

    // ---------------------------------
    // GET PARENT STORAGE SUMMARY
    // ---------------------------------

    fastify.get(
      "/:parentType/:parentId/storage-summary",
      {
        schema: {
          tags: ["Attachments"],
          summary: "Get attachment storage summary for a record",

          params: {
            type: "object",
            required: [
              "parentType",
              "parentId"
            ],
            properties: {
              parentType: {
                type: "string",
                enum: [
                  "user",
                  "project",
                  "company"
                ]
              },

              parentId: {
                type: "string",
                format: "uuid"
              }
            }
          }
        }
      },

      async function (request) {

        const tenantId =
          request.user.tenantId;

        const {
          parentType,
          parentId
        } = request.params;


        return service
          .getParentStorageSummary(
            tenantId,
            parentType,
            parentId
          );
      }
    );

    // ---------------------------------
    // GET WORKSPACE STORAGE SUMMARY
    // ---------------------------------

    fastify.get(
      "/workspace/:parentType/storage-summary",
      {
        schema: {
          tags: ["Attachments"],
          summary: "Get attachment storage summary for a workspace",

          params: {
            type: "object",
            required: [
              "parentType"
            ],
            properties: {
              parentType: {
                type: "string",
                enum: [
                  "user",
                  "project",
                  "company"
                ]
              }
            }
          }
        }
      },

      async function (request) {

        const tenantId =
          request.user.tenantId;

        const {
          parentType
        } = request.params;


        return service
          .getWorkspaceStorageSummary(
            tenantId,
            parentType
          );
      }
    );

    // ---------------------------------
    // GET TENANT STORAGE SUMMARY
    // ---------------------------------

    fastify.get(
      "/tenant/storage-summary",
      {
        schema: {
          tags: ["Attachments"],
          summary: "Get attachment storage summary for the tenant"
        }
      },

      async function (request) {

        const tenantId =
          request.user.tenantId;


        return service
          .getTenantStorageSummary(
            tenantId
          );
      }
    );

    // ---------------------------------
    // OPEN / DOWNLOAD ATTACHMENT
    // ---------------------------------

    fastify.get(
      "/:parentType/:parentId/:attachmentId/open",
      {
        schema: {
          tags: ["Attachments"],
          summary: "Open or download an attachment",

          params: {
            type: "object",
            required: [
              "parentType",
              "parentId",
              "attachmentId"
            ],
            properties: {
              parentType: {
                type: "string",
                enum: [
                  "user",
                  "project",
                  "company"
                ]
              },

              parentId: {
                type: "string",
                format: "uuid"
              },

              attachmentId: {
                type: "string",
                format: "uuid"
              }
            }
          }
        }
      },

      async function (request, reply) {

        const tenantId =
          request.user.tenantId;

        const {
          parentType,
          parentId,
          attachmentId
        } = request.params;


        const opened =
          await service.openAttachment(
            tenantId,
            parentType,
            parentId,
            attachmentId
          );


        const attachment =
          opened.attachment;

        const result =
          opened.result;


        // S3 returns a short-lived
        // presigned download URL.
        if (result.type === "redirect") {

          return {
            type: "redirect",
            url: result.url
          };
        }


        // Local storage returns a stream.
        if (result.type === "stream") {

          reply.header(
            "Content-Type",
            attachment.content_type ||
            "application/octet-stream"
          );

          reply.header(
            "Content-Disposition",
            `attachment; filename*=UTF-8''${encodeURIComponent(
              attachment.original_filename
            )
            }`
          );

          return reply.send(
            result.stream
          );
        }


        const error =
          new Error(
            "Unsupported attachment open result."
          );

        error.statusCode = 500;

        error.code =
          "ATTACHMENT_OPEN_RESULT_INVALID";

        throw error;
      }
    );

    // ---------------------------------
    // DELETE ATTACHMENT PERMANENTLY
    // ---------------------------------

    fastify.delete(
      "/:parentType/:parentId/:attachmentId",
      {
        schema: {
          tags: ["Attachments"],
          summary: "Permanently delete an attachment",

          params: {
            type: "object",
            required: [
              "parentType",
              "parentId",
              "attachmentId"
            ],
            properties: {
              parentType: {
                type: "string",
                enum: [
                  "user",
                  "project",
                  "company"
                ]
              },

              parentId: {
                type: "string",
                format: "uuid"
              },

              attachmentId: {
                type: "string",
                format: "uuid"
              }
            }
          }
        }
      },

      async function (request) {

        const tenantId =
          request.user.tenantId;

        const deletedBy =
          request.user.userId;

        const {
          parentType,
          parentId,
          attachmentId
        } = request.params;


        return service.deleteAttachment(
          tenantId,
          parentType,
          parentId,
          attachmentId,
          deletedBy
        );
      }
    );

    // ==================================================
    // UPLOAD ATTACHMENTS
    //
    // Accepts multipart/form-data.
    // Multiple files may be uploaded in one request.
    //
    // Incoming files are streamed to temporary disk
    // storage first. This allows CPMSOFT to determine
    // the actual file size without buffering the entire
    // file in application memory.
    // ==================================================

    fastify.post(
      "/:parentType/:parentId",
      {
        schema: {
          tags: [
            "Attachments"
          ],

          summary:
            "Upload attachments to a parent record",

          consumes: [
            "multipart/form-data"
          ],

          params: {
            type: "object",

            required: [
              "parentType",
              "parentId"
            ],

            properties: {

              parentType: {
                type: "string",

                enum: [
                  "user",
                  "project",
                  "company"
                ]
              },

              parentId: {
                type: "string",
                format: "uuid"
              }
            },

            additionalProperties:
              false
          }
        }
      },

      async (request) => {

        const tenantId =
          request.user.tenantId;

        const userId =
          request.user.userId;


        const {
          parentType,
          parentId
        } =
          request.params;


        if (!request.isMultipart()) {

          const error =
            new Error(
              "Multipart form data is required."
            );

          error.statusCode = 400;

          error.code =
            "ATTACHMENT_MULTIPART_REQUIRED";

          throw error;
        }


        const tempDirectory =
          await fsPromises.mkdtemp(
            path.join(
              os.tmpdir(),
              "cpmsoft-attachments-"
            )
          );


        const createdAttachments =
          [];


        try {

          const parts =
            request.files();


          for await (
            const part of parts
          ) {

            const tempFilename =
              crypto.randomUUID();


            const tempPath =
              path.join(
                tempDirectory,
                tempFilename
              );


            await pipeline(
              part.file,

              fs.createWriteStream(
                tempPath
              )
            );


            // @fastify/multipart marks the
            // stream when the configured
            // file-size limit was reached.
            if (part.file.truncated) {

              const error =
                new Error(
                  `File exceeds the maximum allowed size: ${part.filename}`
                );

              error.statusCode = 413;

              error.code =
                "ATTACHMENT_FILE_TOO_LARGE";

              throw error;
            }


            const stats =
              await fsPromises.stat(
                tempPath
              );

            const fileHandle =
              await fsPromises.open(
                tempPath,
                "r"
              );

            let headerBuffer;

            try {

              const headerSize =
                Math.min(
                  stats.size,
                  8192
                );

              headerBuffer =
                Buffer.alloc(
                  headerSize
                );

              if (headerSize > 0) {

                await fileHandle.read(
                  headerBuffer,
                  0,
                  headerSize,
                  0
                );
              }

            } finally {

              await fileHandle.close();
            }


            const created =
              await service.createAttachment(
                tenantId,
                parentType,
                parentId,
                userId,
                {
                  originalFilename:
                    part.filename,

                  contentType:
                    part.mimetype ||
                    "application/octet-stream",

                  fileSizeBytes:
                    stats.size,

                  headerBuffer:
                    headerBuffer,

                  validationPath:
                    tempPath,

                  source:
                    fs.createReadStream(
                      tempPath
                    )
                }
              );


            createdAttachments.push(
              created
            );


            // The physical attachment has now
            // been copied to S3 or Local storage.
            // Remove this individual temp file
            // immediately rather than waiting for
            // the entire request to finish.
            await fsPromises.unlink(
              tempPath
            );
          }


          if (
            createdAttachments.length === 0
          ) {

            const error =
              new Error(
                "At least one attachment file is required."
              );

            error.statusCode = 400;

            error.code =
              "ATTACHMENT_FILE_REQUIRED";

            throw error;
          }


          return {
            count:
              createdAttachments.length,

            attachments:
              createdAttachments.map(
                toPublicAttachment
              )
          };

        } finally {

          // Always remove temporary files,
          // including files left behind after
          // an upload or validation failure.
          await fsPromises.rm(
            tempDirectory,
            {
              recursive: true,
              force: true
            }
          );
        }
      }
    );

  };