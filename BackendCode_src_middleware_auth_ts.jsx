import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle } from 'lucide-react';

export default function BackendCode_src_middleware_auth_ts() {
  const [copied, setCopied] = React.useState(false);
  
  const code = `// PATH: src/middleware/auth.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyJWT, JWTPayload } from '../security/jwt.js';

// Extend FastifyRequest to include user and tenantId
declare module 'fastify' {
  interface FastifyRequest {
    user?: JWTPayload;
    userId?: string;
    tenantId?: string;
  }
}

/**
 * Authentication middleware
 * Verifies JWT and attaches user/tenant to request
 */
export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Missing or invalid Authorization header',
      });
    }

    const token = authHeader.substring(7); // Remove "Bearer "

    // Verify JWT
    const payload = await verifyJWT(token);

    // Attach user data to request
    request.user = payload;
    request.userId = payload.sub;
    request.tenantId = payload.tenant_id;

    // Log authentication
    request.log.info({
      user_id: payload.sub,
      tenant_id: payload.tenant_id,
      role: payload.role,
    }, 'User authenticated');

  } catch (error: any) {
    request.log.warn({ error: error.message }, 'Authentication failed');

    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Invalid or expired token',
    });
  }
}

/**
 * Require admin role
 */
export async function requireAdmin(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  if (!request.user || request.user.role !== 'admin') {
    return reply.status(403).send({
      error: 'Forbidden',
      message: 'Admin role required',
    });
  }
}

/**
 * Require specific permission
 */
export function requirePermission(permission: string) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!request.user) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    const permissions = request.user.permissions || [];

    if (!permissions.includes(permission) && request.user.role !== 'admin') {
      return reply.status(403).send({
        error: 'Forbidden',
        message: \`Permission required: \${permission}\`,
      });
    }
  };
}

/**
 * Optional authentication (doesn't fail if no token)
 */
export async function optionalAuth(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const authHeader = request.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = await verifyJWT(token);

      request.user = payload;
      request.userId = payload.sub;
      request.tenantId = payload.tenant_id;
    }
  } catch (error) {
    // Silently ignore auth errors for optional auth
    request.log.debug('Optional auth failed, continuing without user');
  }
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
              <h2 className="text-lg font-mono text-gray-700">src/middleware/auth.ts</h2>
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