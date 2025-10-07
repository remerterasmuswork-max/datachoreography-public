import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle } from 'lucide-react';

export default function BackendCode_src_routes_auth_ts() {
  const [copied, setCopied] = React.useState(false);
  
  const code = `// PATH: src/routes/auth.ts
import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db.js';
import { users, complianceEvents } from '../schema.js';
import { eq, and } from 'drizzle-orm';
import { hashPassword, verifyPassword } from '../security/hash.js';
import { signJWT, signRefreshToken, verifyJWT, signImpersonationJWT } from '../security/jwt.js';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';
import { generateSecureToken } from '../security/hash.js';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  full_name: z.string().min(1),
  tenant_id: z.string().uuid(),
});

const refreshSchema = z.object({
  refresh_token: z.string(),
});

const impersonateSchema = z.object({
  target_user_id: z.string().uuid(),
  duration_minutes: z.number().min(1).max(480).default(30),
});

export async function authRoutes(fastify: FastifyInstance) {
  
  // ==========================================================================
  // POST /v2/auth/register
  // Register a new user
  // ==========================================================================
  fastify.post('/register', async (request, reply) => {
    const body = registerSchema.parse(request.body);

    // Check if user already exists
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.email, body.email))
      .limit(1);

    if (existing) {
      return reply.status(409).send({
        error: 'Conflict',
        message: 'User with this email already exists',
      });
    }

    // Hash password
    const passwordHash = await hashPassword(body.password);

    // Create user
    const [user] = await db
      .insert(users)
      .values({
        email: body.email,
        passwordHash,
        fullName: body.full_name,
        tenantId: body.tenant_id,
        role: 'user',
      })
      .returning();

    // Generate tokens
    const accessToken = await signJWT({
      sub: user.id,
      email: user.email,
      tenant_id: user.tenantId,
      role: user.role,
    });

    const refreshToken = await signRefreshToken(user.id);

    request.log.info({
      user_id: user.id,
      tenant_id: user.tenantId,
    }, 'User registered');

    return reply.status(201).send({
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.fullName,
        role: user.role,
        tenant_id: user.tenantId,
      },
    });
  });

  // ==========================================================================
  // POST /v2/auth/login
  // Authenticate user
  // ==========================================================================
  fastify.post('/login', async (request, reply) => {
    const body = loginSchema.parse(request.body);

    // Find user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, body.email))
      .limit(1);

    if (!user) {
      // Don't reveal whether user exists
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Invalid credentials',
      });
    }

    // Verify password
    const valid = await verifyPassword(body.password, user.passwordHash);

    if (!valid) {
      request.log.warn({
        user_id: user.id,
        email: body.email,
      }, 'Failed login attempt');

      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Invalid credentials',
      });
    }

    // Generate tokens
    const accessToken = await signJWT({
      sub: user.id,
      email: user.email,
      tenant_id: user.tenantId,
      role: user.role,
    });

    const refreshToken = await signRefreshToken(user.id);

    // Update last login
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id));

    request.log.info({
      user_id: user.id,
      tenant_id: user.tenantId,
    }, 'User logged in');

    return reply.send({
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.fullName,
        role: user.role,
        tenant_id: user.tenantId,
      },
    });
  });

  // ==========================================================================
  // POST /v2/auth/refresh
  // Refresh access token
  // ==========================================================================
  fastify.post('/refresh', async (request, reply) => {
    const body = refreshSchema.parse(request.body);

    try {
      // Verify refresh token
      const payload = await verifyJWT(body.refresh_token);

      if (!payload.sub) {
        throw new Error('Invalid refresh token');
      }

      // Fetch user
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, payload.sub))
        .limit(1);

      if (!user) {
        throw new Error('User not found');
      }

      // Generate new access token
      const accessToken = await signJWT({
        sub: user.id,
        email: user.email,
        tenant_id: user.tenantId,
        role: user.role,
      });

      return reply.send({
        access_token: accessToken,
      });
    } catch (error) {
      request.log.warn({ error }, 'Token refresh failed');

      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Invalid or expired refresh token',
      });
    }
  });

  // ==========================================================================
  // POST /v2/auth/impersonate
  // Admin-only: Impersonate another user
  // ==========================================================================
  fastify.post('/impersonate', {
    preHandler: [authMiddleware, requireAdmin],
  }, async (request, reply) => {
    const body = impersonateSchema.parse(request.body);
    const adminUserId = request.userId!;
    const adminEmail = request.user!.email;

    // Fetch target user
    const [targetUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, body.target_user_id))
      .limit(1);

    if (!targetUser) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Target user not found',
      });
    }

    // Generate impersonation session ID
    const sessionId = generateSecureToken(16);

    // Generate impersonation JWT
    const impersonationToken = await signImpersonationJWT(
      adminUserId,
      {
        sub: targetUser.id,
        email: targetUser.email,
        tenant_id: targetUser.tenantId,
        role: targetUser.role,
      },
      sessionId,
      body.duration_minutes
    );

    // Log impersonation to compliance
    await db.insert(complianceEvents).values({
      tenantId: targetUser.tenantId,
      category: 'user_action',
      eventType: 'impersonation_started',
      refType: 'user',
      refId: targetUser.id,
      actor: adminEmail,
      actorType: 'admin',
      payload: {
        admin_user_id: adminUserId,
        target_user_id: targetUser.id,
        session_id: sessionId,
        duration_minutes: body.duration_minutes,
      },
      piiRedacted: true,
      digestSha256: '', // Will be computed by compliance module
      prevDigestSha256: null,
    });

    request.log.warn({
      admin_user_id: adminUserId,
      target_user_id: targetUser.id,
      session_id: sessionId,
    }, 'Admin impersonation started');

    return reply.send({
      access_token: impersonationToken,
      session_id: sessionId,
      impersonating: {
        user_id: targetUser.id,
        email: targetUser.email,
        full_name: targetUser.fullName,
      },
      expires_in_minutes: body.duration_minutes,
    });
  });

  // ==========================================================================
  // POST /v2/auth/logout
  // Logout (no-op for JWT, but useful for logging)
  // ==========================================================================
  fastify.post('/logout', {
    preHandler: [authMiddleware],
  }, async (request, reply) => {
    request.log.info({
      user_id: request.userId,
    }, 'User logged out');

    return reply.status(204).send();
  });

  // ==========================================================================
  // GET /v2/auth/me
  // Get current user info
  // ==========================================================================
  fastify.get('/me', {
    preHandler: [authMiddleware],
  }, async (request, reply) => {
    const userId = request.userId!;

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'User not found',
      });
    }

    return reply.send({
      id: user.id,
      email: user.email,
      full_name: user.fullName,
      role: user.role,
      tenant_id: user.tenantId,
      created_at: user.createdAt,
      last_login_at: user.lastLoginAt,
    });
  });
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
              <h2 className="text-lg font-mono text-gray-700">src/routes/auth.ts</h2>
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