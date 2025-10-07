import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle } from 'lucide-react';

export default function BackendCode_src_index_ts() {
  const [copied, setCopied] = React.useState(false);
  
  const code = `// PATH: src/index.ts
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { checkDatabaseHealth, closeDatabaseConnection } from './db.js';
import { authRoutes } from './routes/auth.js';
import { tenantRoutes } from './routes/tenants.js';
import { workflowRoutes } from './routes/workflows.js';
import { credentialRoutes } from './routes/credentials.js';
import { complianceRoutes } from './routes/compliance.js';
import { ZodError } from 'zod';

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

// Create Fastify instance with structured logging
const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: process.env.NODE_ENV === 'development' ? {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    } : undefined,
  },
  requestIdHeader: 'x-request-id',
  requestIdLogLabel: 'request_id',
  disableRequestLogging: false,
  trustProxy: true,
});

// =============================================================================
// GLOBAL ERROR HANDLER
// =============================================================================

fastify.setErrorHandler((error, request, reply) => {
  const requestId = request.id;

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    request.log.warn({ error: error.issues, request_id: requestId }, 'Validation error');
    return reply.status(400).send({
      error: 'Validation Error',
      message: 'Request validation failed',
      details: error.issues,
      request_id: requestId,
    });
  }

  // Handle known HTTP errors
  if (error.statusCode && error.statusCode < 500) {
    request.log.warn({ error, request_id: requestId }, 'Client error');
    return reply.status(error.statusCode).send({
      error: error.name || 'Error',
      message: error.message,
      request_id: requestId,
    });
  }

  // Handle server errors (don't leak details to client)
  request.log.error({ error, request_id: requestId }, 'Server error');
  return reply.status(500).send({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
    request_id: requestId,
  });
});

// =============================================================================
// GLOBAL HOOKS
// =============================================================================

// Log all requests
fastify.addHook('onRequest', async (request, reply) => {
  request.log.info({
    method: request.method,
    url: request.url,
    ip: request.ip,
    user_agent: request.headers['user-agent'],
  }, 'Incoming request');
});

// Add correlation ID to all responses
fastify.addHook('onSend', async (request, reply, payload) => {
  reply.header('X-Request-ID', request.id);
  reply.header('X-Response-Time', reply.getResponseTime());
  return payload;
});

// =============================================================================
// PLUGINS
// =============================================================================

// CORS
await fastify.register(cors, {
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key', 'X-Request-ID'],
});

// =============================================================================
// HEALTH CHECK
// =============================================================================

fastify.get('/healthz', async (request, reply) => {
  const dbHealthy = await checkDatabaseHealth();
  
  const health = {
    status: dbHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbHealthy ? 'connected' : 'disconnected',
  };

  const statusCode = dbHealthy ? 200 : 503;
  return reply.status(statusCode).send(health);
});

fastify.get('/readyz', async (request, reply) => {
  return reply.send({ status: 'ready' });
});

// =============================================================================
// API ROUTES
// =============================================================================

await fastify.register(authRoutes, { prefix: '/v2/auth' });
await fastify.register(tenantRoutes, { prefix: '/v2/tenants' });
await fastify.register(workflowRoutes, { prefix: '/v2/workflows' });
await fastify.register(credentialRoutes, { prefix: '/v2/credentials' });
await fastify.register(complianceRoutes, { prefix: '/v2/compliance' });

// Root route
fastify.get('/', async (request, reply) => {
  return reply.send({
    name: 'DataChoreography API',
    version: '2.0.0',
    status: 'operational',
    documentation: '/docs',
  });
});

// =============================================================================
// GRACEFUL SHUTDOWN
// =============================================================================

const signals = ['SIGINT', 'SIGTERM'];

signals.forEach((signal) => {
  process.on(signal, async () => {
    fastify.log.info(\`Received \${signal}, starting graceful shutdown\`);

    try {
      await fastify.close();
      await closeDatabaseConnection();
      fastify.log.info('Graceful shutdown complete');
      process.exit(0);
    } catch (error) {
      fastify.log.error({ error }, 'Error during shutdown');
      process.exit(1);
    }
  });
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  fastify.log.fatal({ error }, 'Uncaught exception');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  fastify.log.fatal({ reason, promise }, 'Unhandled rejection');
  process.exit(1);
});

// =============================================================================
// START SERVER
// =============================================================================

try {
  await fastify.listen({ port: PORT, host: HOST });
  fastify.log.info(\`🚀 Server listening on http://\${HOST}:\${PORT}\`);
  fastify.log.info(\`📚 API docs available at http://\${HOST}:\${PORT}/docs\`);
} catch (error) {
  fastify.log.error({ error }, 'Failed to start server');
  process.exit(1);
}`;

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-mono text-gray-700">src/index.ts</h2>
              <Button onClick={copyCode} size="sm">
                {copied ? <CheckCircle className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
              <code>{code}</code>
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}