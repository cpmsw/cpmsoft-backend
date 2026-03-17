const fastify = require('fastify')({ logger: true });

const apiGuard = require('./middleware/apiGuard');
const rateLimit = require('@fastify/rate-limit');

const swagger = require('@fastify/swagger');
const swaggerUI = require('@fastify/swagger-ui');
const cors = require('@fastify/cors');
const path = require('path');
const AutoLoad = require('@fastify/autoload');

// Plugins & hooks
fastify.register(rateLimit, {
    global: false
});


// REGISTER CORS FIRST
fastify.register(cors, {
  origin: (origin, cb) => {
    const allowed = [
      'https://cpmsoft.app',
      'https://www.cpmsoft.com',
      'https://contact.cpmsoft.com',
      'https://api.cpmsoft.app',
       // ✅ DEV
      'http://localhost:5173',
      'http://192.168.1.67:5173',
      'http://127.0.0.1:5173',
      'http://172.22.167.221:5173'
    ];

    if (!origin || allowed.includes(origin)) {
      cb(null, true);
    } else {
      cb(new Error("Not allowed by CORS"), false);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
});



fastify.addHook('onRequest', apiGuard);


const isDev = process.env.NODE_ENV !== 'production';



  fastify.register(swagger, {
    openapi: {
      info: {
        title: 'CPMSOFT API',
        description: 'CPMSOFT backend API',
        version: '1.0.0'
      },
      servers: [
        { url: 'https://api.cpmsoft.app' }
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      }
    }
  });

  

  fastify.register(swaggerUI, {
    routePrefix: '/api/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false
    },
  theme: {
    title: 'CPMSOFT API Documentation'
  },
  staticCSP: true,
  transformStaticCSP: (header) => header
  });





fastify.addHook('onRoute', (routeOptions) => {
  if (routeOptions.url.startsWith('/api/') &&
      !['/api/auth/login', '/api/auth/activate','/api/ping', '/api/health'].includes(routeOptions.url)) {
    routeOptions.schema = routeOptions.schema || {};
    routeOptions.schema.security = [{ bearerAuth: [] }];
  }
});

/**
 * Routes
 */
// fastify.register(require('./routes/auth'), { prefix: '/api/auth' });
// fastify.register(require('./routes/security2fa'), { prefix: '/api/security' });
// fastify.register(require('./routes/profile'), { prefix: '/api/profile' });
// fastify.register(require('./routes/ping'), { prefix: '/api' });
// fastify.register(require('./modules/projects/projects.routes'), { prefix: '/api/projects' });
// fastify.register(require('./modules/projects/projectLines.routes'), { prefix: '/api/projects' });
// fastify.register(require('./routes/settings'), { prefix: '/api/settings' });
// fastify.register(require('./modules/customers/customers.routes'), { prefix: '/api/customers'});
// fastify.register(require('./routes/health'), { prefix: '/api' });
// fastify.register(require('./routes/test-email'), { prefix: '/api' });
// fastify.register(require('./routes/reminders'), { prefix: '/api'});

// Load all system routes
fastify.register(AutoLoad, {
  dir: path.join(__dirname, 'routes'),
  options: { prefix: '/api' }
});

// Load all business modules
fastify.register(AutoLoad, {
  dir: path.join(__dirname, 'modules'),
  options: { prefix: '/api' }
});

/**
 * Start server
 */
const start = async () => {

// 🔐 REQUIRED ENV VALIDATION (CORRECT LOCATION)
  const requiredEnv = [
    'JWT_SECRET',
    'SMTP_HOST',
    'SMTP_USER',
    'SMTP_PASS',
    'RECAPTCHA_SITE_KEY',
    'RECAPTCHA_SECRET_KEY'
  ];

  const missing = requiredEnv.filter(v => !process.env[v]);
  if (missing.length) {
    fastify.log.error(`Missing env vars: ${missing.join(', ')}`);
    process.exit(1);
  }

  try {
    await fastify.listen({ port: 4000, host: '127.0.0.1' });
        const { startReminderRunner } = require('./jobs/reminderRunner');
        startReminderRunner();

    fastify.log.info('🚀 Fastify running on http://127.0.0.1:4000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
