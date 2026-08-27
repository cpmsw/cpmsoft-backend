const service =
  require("cpmsoft-core/users/users.service");

const requirePermission =
  require("../../middleware/requirePermission");

module.exports = async function (fastify) {

  // ---------------------------------
  // GET USERS
  // ---------------------------------
  fastify.get("/", {
    preHandler: [
      requirePermission("users.view")
    ]
  }, async (request) => {

    const tenantId =
      request.user.tenantId;

    const { search } =
      request.query;

    return service.getUsers(
      tenantId,
      search
    );
  });


  // ---------------------------------
  // COUNT USERS
  // ---------------------------------
  fastify.get("/count", {
    preHandler: [
      requirePermission("users.view")
    ]
  }, async (request) => {

    const tenantId =
      request.user.tenantId;

    const count =
      await service.countUsers(
        tenantId
      );

    return {
      count
    };
  });

  // ---------------------------------
  // HISTORY USER SEARCH
  // ---------------------------------
  fastify.get("/history-search", {

    preHandler: [
      requirePermission("users.view")
    ],

    schema: {

      querystring: {
        type: "object",

        required: [
          "q"
        ],

        properties: {

          q: {
            type: "string",
            minLength: 1,
            maxLength: 200
          }

        },

        additionalProperties: false
      }
    }

  }, async (request) => {

    const tenantId =
      request.user.tenantId;


    const { q } =
      request.query;


    return service.searchUsersForHistory(
      tenantId,
      q
    );
  });

  // ---------------------------------
  // GET ONE USER
  // ---------------------------------
  fastify.get("/:id", {
    preHandler: [
      requirePermission("users.view")
    ]
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


  // ---------------------------------
  // CREATE USER
  // ---------------------------------
  fastify.post("/", {
    preHandler: [
      requirePermission("users.create")
    ],

    schema: {
      body: {
        type: "object",

        required: [
          "first_name",
          "last_name",
          "email"
        ],

        properties: {
          id: {
            type: "string",
            format: "uuid",
            nullable: true
          },

          first_name: {
            type: "string"
          },

          last_name: {
            type: "string"
          },

          email: {
            type: "string",
            format: "email"
          },

          excludeId: {
            type: "string",
            format: "uuid",
            nullable: true
          },

          phone: {
            type: "string"
          },

          job_title: {
            type: "string"
          },

          department: {
            type: "string"
          },

          password: {
            type: "string"
          },

          twofa_required: {
            type: "boolean"
          }
        }
      }
    }

  }, async (request, reply) => {

    const tenantId =
      request.user.tenantId;

    const userId =
      request.user.userId;

    try {

      const result =
        await service.create(
          tenantId,
          userId,
          request.body
        );

      return reply
        .code(201)
        .send(result);

    } catch (error) {

      return reply
        .code(
          error.statusCode || 400
        )
        .send({
          code:
            error.code ||
            "USER_SAVE_FAILED",

          message:
            error.message ||
            "The user could not be saved.",

          userId:
            error.userId || null,

          isVerified:
            error.isVerified === true
        });
    }
  });


  // ---------------------------------
  // UPDATE USER
  // ---------------------------------
  fastify.put("/:id", {
    preHandler: [
      requirePermission("users.edit")
    ]
  }, async (request) => {

    const tenantId =
      request.user.tenantId;

    const adminUserId =
      request.user.userId;

    const { id } =
      request.params;

    return service.update(
      tenantId,
      adminUserId,
      id,
      request.body
    );
  });


  // ---------------------------------
  // DEACTIVATE USER
  // ---------------------------------
  fastify.delete("/:id", {
    preHandler: [
      requirePermission(
        "users.deactivate"
      )
    ]
  }, async (request) => {

    const tenantId =
      request.user.tenantId;

    const adminUserId =
      request.user.userId;

    const { id } =
      request.params;

    return service.softDelete(
      tenantId,
      adminUserId,
      id
    );
  });


  // ---------------------------------
  // CHECK EMAIL
  // ---------------------------------
  fastify.get("/check-email", {
    preHandler: [
      requirePermission("users.view")
    ],

    schema: {
      querystring: {
        type: "object",

        required: [
          "email"
        ],

        properties: {
          email: {
            type: "string",
            format: "email"
          },

          excludeId: {
            type: "string",
            format: "uuid"
          }
        }
      }
    }

  }, async (request) => {

    const tenantId =
      request.user.tenantId;

    const {
      email,
      excludeId
    } = request.query;

    return service.checkEmailExists(
      tenantId,
      email,
      excludeId || null
    );
  });


  // ---------------------------------
  // RESEND INVITE
  // ---------------------------------
  fastify.post(
    "/resend-invite/:id",
    {
      preHandler: [
        requirePermission(
          "users.edit"
        )
      ],

      schema: {
        summary:
          "Resend activation code",

        tags: [
          "Users"
        ],

        params: {
          type: "object",

          required: [
            "id"
          ],

          properties: {
            id: {
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

      const { id } =
        request.params;

      return service.resendInvite(
        tenantId,
        id
      );
    }
  );


  // ---------------------------------
  // REACTIVATE USER
  // ---------------------------------
  fastify.post(
    "/:id/reactivate",
    {
      preHandler: [
        requirePermission("users.edit")
      ]
    },

    async (request) => {

      return service.reactivateUser(
        request.user.tenantId,
        request.params.id
      );
    }
  );

};