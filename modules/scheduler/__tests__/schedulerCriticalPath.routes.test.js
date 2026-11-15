
"use strict";

// ==================================================
// CPMSOFT - CRITICAL PATH HISTORY API TESTS
// ==================================================

const test = require("node:test");
const assert = require("node:assert/strict");

const Fastify = require("fastify");

const scheduler =
  require("cpmsoft-core/scheduler");

const accessService =
  require("../../../services/access.service");

const criticalPathRoutes =
  require("../schedulerCriticalPath.routes");

const TENANT =
  "11111111-1111-4111-8111-111111111111";

const USER =
  "33333333-3333-4333-8333-333333333333";

const SCHEDULE =
  "22222222-2222-4222-8222-222222222222";


// ==================================================
// ISOLATED FASTIFY TEST SERVER
// ==================================================

async function createTestApp(t, {
  authenticated = true,
  allowed = true
} = {}) {

  const app = Fastify({
    logger: false
  });

  const permissionMock = t.mock.method(
    accessService,
    "hasPermission",
    async () => allowed
  );

  app.addHook("onRequest", async request => {
    if (authenticated) {
      request.user = {
        userId: USER,
        tenantId: TENANT
      };
    }
  });

  app.register(criticalPathRoutes, {
    prefix: "/schedules"
  });

  t.after(async () => {
    await app.close();
  });

  await app.ready();

  return {
    app,
    permissionMock
  };
}


// ==================================================
// LIST SNAPSHOTS
// ==================================================

test("lists snapshots for an authorized user", async t => {
  const listMock = t.mock.method(
    scheduler.cpmCriticalPathHistory,
    "listSnapshots",
    async () => [
      {
        scheduleRevision: "85",
        pathCount: 1
      }
    ]
  );

  const { app, permissionMock } =
    await createTestApp(t);

  const response = await app.inject({
    method: "GET",
    url:
      `/schedules/${SCHEDULE}/critical-path-snapshots`
  });

  assert.equal(response.statusCode, 200);

  assert.deepEqual(response.json(), [
    {
      scheduleRevision: "85",
      pathCount: 1
    }
  ]);

  assert.deepEqual(
    listMock.mock.calls[0].arguments,
    [TENANT, SCHEDULE]
  );

  assert.deepEqual(
    permissionMock.mock.calls[0].arguments,
    [TENANT, USER, "projects.view"]
  );
});


test("returns an empty list when no snapshots exist", async t => {
  t.mock.method(
    scheduler.cpmCriticalPathHistory,
    "listSnapshots",
    async () => []
  );

  const { app } = await createTestApp(t);

  const response = await app.inject({
    method: "GET",
    url:
      `/schedules/${SCHEDULE}/critical-path-snapshots`
  });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), []);
});


// ==================================================
// GET HISTORICAL REVISION
// ==================================================

test("retrieves a saved Critical Path revision", async t => {
  const getMock = t.mock.method(
    scheduler.cpmCriticalPathHistory,
    "getSnapshot",
    async () => ({
      scheduleRevision: "85",
      pathCount: 1,
      paths: [
        {
          pathNumber: 1,
          activities: [
            { id: "activity-1" },
            { id: "activity-2" }
          ],
          relationships: [
            {
              predecessorId: "activity-1",
              successorId: "activity-2",
              type: "FS"
            }
          ]
        }
      ]
    })
  );

  const { app } = await createTestApp(t);

  const response = await app.inject({
    method: "GET",
    url:
      `/schedules/${SCHEDULE}/critical-path-snapshots/85`
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json().scheduleRevision, "85");
  assert.equal(response.json().paths.length, 1);

  assert.deepEqual(
    getMock.mock.calls[0].arguments,
    [TENANT, SCHEDULE, "85"]
  );
});


// ==================================================
// AUTHENTICATION AND AUTHORIZATION
// ==================================================

test("rejects requests without authentication", async t => {
  const { app, permissionMock } =
    await createTestApp(t, {
      authenticated: false
    });

  const response = await app.inject({
    method: "GET",
    url:
      `/schedules/${SCHEDULE}/critical-path-snapshots`
  });

  assert.equal(response.statusCode, 401);
  assert.equal(
    response.json().code,
    "AUTH_CONTEXT_MISSING"
  );

  assert.equal(permissionMock.mock.callCount(), 0);
});


test("rejects requests without projects.view", async t => {
  const { app } = await createTestApp(t, {
    allowed: false
  });

  const response = await app.inject({
    method: "GET",
    url:
      `/schedules/${SCHEDULE}/critical-path-snapshots`
  });

  assert.equal(response.statusCode, 403);
  assert.equal(
    response.json().code,
    "PERMISSION_DENIED"
  );
});


// ==================================================
// PARAMETER VALIDATION
// ==================================================

test("rejects an invalid schedule UUID", async t => {
  const { app } = await createTestApp(t);

  const response = await app.inject({
    method: "GET",
    url:
      "/schedules/invalid-id/critical-path-snapshots"
  });

  assert.equal(response.statusCode, 400);
});


test("rejects an invalid revision", async t => {
  const { app } = await createTestApp(t);

  const response = await app.inject({
    method: "GET",
    url:
      `/schedules/${SCHEDULE}/critical-path-snapshots/abc`
  });

  assert.equal(response.statusCode, 400);
});


// ==================================================
// NOT FOUND ERRORS
// ==================================================

test("returns 404 when schedule does not exist", async t => {
  t.mock.method(
    scheduler.cpmCriticalPathHistory,
    "listSnapshots",
    async () => {
      const error = new Error("Schedule not found.");
      error.statusCode = 404;
      error.code = "SCHEDULE_NOT_FOUND";
      throw error;
    }
  );

  const { app } = await createTestApp(t);

  const response = await app.inject({
    method: "GET",
    url:
      `/schedules/${SCHEDULE}/critical-path-snapshots`
  });

  assert.equal(response.statusCode, 404);
});


test("returns 404 when revision does not exist", async t => {
  t.mock.method(
    scheduler.cpmCriticalPathHistory,
    "getSnapshot",
    async () => {
      const error = new Error(
        "Critical Path snapshot not found."
      );
      error.statusCode = 404;
      error.code =
        "CRITICAL_PATH_SNAPSHOT_NOT_FOUND";
      throw error;
    }
  );

  const { app } = await createTestApp(t);

  const response = await app.inject({
    method: "GET",
    url:
      `/schedules/${SCHEDULE}/critical-path-snapshots/99`
  });

  assert.equal(response.statusCode, 404);
});
