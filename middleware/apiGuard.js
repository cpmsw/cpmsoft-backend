const verifyToken = require('./verifyToken');


// Public API routes (no auth)
const PUBLIC_ROUTES = [
  { method: 'POST', path: '/api/auth/login' },
  { method: 'POST', path: '/api/auth/2fa/setup-first' },
  { method: 'POST', path: '/api/auth/2fa/login-verify' },  // 🔥 add this
  { method: 'GET', path: '/api/auth/_test' },             // 🔥 add this
  { method: 'POST', path: '/api/auth/send-reset-code' },
  { method: 'POST', path: '/api/auth/verify-reset-code' },
  { method: 'POST', path: '/api/auth/reset-password-code' },
  { method: 'POST', path: '/api/auth/login-swagger' },
  { method: 'POST', path: '/api/auth/2fa/show-existing' },
  { method: 'GET', path: '/api/health' },
  { method: 'GET', path: '/api/ready' },
  { method: 'GET', path: '/api/ping' }
];

function isPublicRoute(request) {
  return PUBLIC_ROUTES.some(r =>
    r.method === request.method &&
    r.path === request.url
  );
}

module.exports = async function apiGuard(request, reply) {
// ✅ Allow CORS preflight
  if (request.method === 'OPTIONS') {
    return;
  }

  console.log("REQUEST URL:", request.url);
  console.log("REQUEST METHOD:", request.method);

  // Only guard API routes
  if (!request.url.startsWith('/api/')) {
    return;
  }

  // Allow CORS preflight
  if (request.method === 'OPTIONS') {
    return;
  }

  // Allow public routes
  if (isPublicRoute(request)) {
    return;
  }

  // Swagger UI
  if (request.url.startsWith('/api/docs')) {
    return;
  }

  // Everything else requires auth
  return verifyToken(request, reply);
};
