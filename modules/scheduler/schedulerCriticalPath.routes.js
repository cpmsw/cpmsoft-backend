
"use strict";

// ==================================================
// CPMSOFT - CRITICAL PATH HISTORY ROUTES
//
// Read-only access to historical Critical Path
// snapshots saved by the CPM calculation engine.
// ==================================================

const scheduler =
  require("cpmsoft-core/scheduler");

const requirePermission =
  require("../../middleware/requirePermission");

const criticalPathHistory =
  scheduler.cpmCriticalPathHistory;


// ==================================================
// ROUTES
// ==================================================

module.exports =
  async function (fastify) {

    // ================================================
    // LIST CRITICAL PATH SNAPSHOT REVISIONS
    // ================================================

    fastify.get(
      "/:scheduleId/critical-path-snapshots",
      {
        preHandler: [
          requirePermission("projects.view")
        ],

        schema: {
          tags: [
            "Scheduler Critical Path"
          ],

          summary:
            "List historical Critical Path snapshots",

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

        return criticalPathHistory.listSnapshots(
          tenantId,
          scheduleId
        );
      }
    );


    // ================================================
    // GET CRITICAL PATH SNAPSHOT BY REVISION
    // ================================================

    fastify.get(
      "/:scheduleId/critical-path-snapshots/:revision",
      {
        preHandler: [
          requirePermission("projects.view")
        ],

        schema: {
          tags: [
            "Scheduler Critical Path"
          ],

          summary:
            "Get historical Critical Path snapshot",

          params: {
            type: "object",

            required: [
              "scheduleId",
              "revision"
            ],

            properties: {
              scheduleId: {
                type: "string",
                format: "uuid"
              },

              revision: {
                type: "string",
                pattern: "^[0-9]+$"
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
          revision
        } = request.params;

        return criticalPathHistory.getSnapshot(
          tenantId,
          scheduleId,
          revision
        );
      }
    );
  };
