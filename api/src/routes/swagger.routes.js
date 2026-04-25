import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from '../config/swagger.js';

/**
 * Registers Swagger UI and the raw OpenAPI JSON spec.
 *
 * - UI:   GET /api/docs
 * - JSON: GET /api/docs.json
 *
 * Disable in production: set SWAGGER_ENABLED=false
 *
 * How to run requests:
 *  1. POST /api/auth/login → copy the token
 *  2. Click "Authorize" 🔒 → paste: Bearer <token>
 *  3. Add X-Tenant-Slug header if needed
 *  4. Click "Try it out" on any endpoint → "Execute"
 */
export function registerSwagger(app) {
  if (process.env.SWAGGER_ENABLED === 'false') return;

  // Raw OpenAPI JSON — useful for code generation and external tooling
  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.status(200).send(swaggerSpec);
  });

  // Interactive UI
  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      // Show the spec selector bar at the top
      explorer: true,

      swaggerOptions: {
        // ── Authorization ───────────────────────────────────────────────────
        // Keep the token across page refreshes
        persistAuthorization: true,

        // ── Layout ──────────────────────────────────────────────────────────
        // Collapse all tag groups by default — expand one at a time
        docExpansion: 'none',
        // Hide the schemas/models section at the bottom (reduces noise)
        defaultModelsExpandDepth: -1,
        // Expand operation details when opened (show params + body)
        defaultModelExpandDepth: 3,
        // Show the tag filter/search box at the top
        filter: true,
        // Deep link — URL updates as you navigate (shareable links)
        deepLinking: true,

        // ── Request execution ────────────────────────────────────────────────
        // "Try it out" open by default on every endpoint
        tryItOutEnabled: true,
        // Show how long each request took (ms)
        displayRequestDuration: true,
        // Show the curl command for every executed request
        showMutatedRequest: true,
        // Show response headers in the response panel
        responseInterceptor: undefined,

        // ── Display ──────────────────────────────────────────────────────────
        // Show vendor extensions (x-* fields) in the UI
        showExtensions: true,
        showCommonExtensions: true,
        // Sort endpoints alphabetically within each tag
        operationsSorter: 'alpha',
        // Sort tags (groups) alphabetically
        tagsSorter: 'alpha',
        // Show the base URL selector
        displayOperationId: false,
        // Syntax highlight theme for request/response bodies
        syntaxHighlight: {
          activate: true,
          theme: 'monokai',
        },
        // Wrap long lines in request/response bodies
        wrapLines: true,
        // Max displayed response size before truncation (bytes)
        maxDisplayedTags: 50,
      },

      // ── Custom branding ────────────────────────────────────────────────────
      customSiteTitle: 'Ticket Management API',
      customfavIcon:   '/favicon.ico',
      customCss: `
        .swagger-ui .topbar { background-color: #1a1a2e; }
        .swagger-ui .topbar .download-url-wrapper { display: none; }
        .swagger-ui .info .title { color: #4f46e5; }
        .swagger-ui .opblock.opblock-get    .opblock-summary-method { background: #2563eb; }
        .swagger-ui .opblock.opblock-post   .opblock-summary-method { background: #16a34a; }
        .swagger-ui .opblock.opblock-put    .opblock-summary-method { background: #d97706; }
        .swagger-ui .opblock.opblock-patch  .opblock-summary-method { background: #7c3aed; }
        .swagger-ui .opblock.opblock-delete .opblock-summary-method { background: #dc2626; }
        .swagger-ui .btn.execute { background-color: #4f46e5; border-color: #4f46e5; }
        .swagger-ui .btn.execute:hover { background-color: #4338ca; }
      `,
    }),
  );
}
