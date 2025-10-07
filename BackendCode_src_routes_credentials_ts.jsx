import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle } from 'lucide-react';

export default function BackendCode_src_routes_credentials_ts() {
  const [copied, setCopied] = React.useState(false);
  
  const code = `// PATH: src/routes/credentials.ts
import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db.js';
import { credentials, complianceEvents } from '../schema.js';
import { eq, and } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth.js';
import { storeCredential, getCredential, deleteCredential, testConnection } from '../modules/vault/index.js';
import { generateSecureToken, sha256 } from '../security/hash.js';

const createCredentialSchema = z.object({
  provider: z.enum(['shopify', 'stripe', 'xero', 'gmail', 'msgraph', 'slack']),
  connection_name: z.string().min(1).optional(),
  credentials: z.record(z.any()), // Provider-specific credentials
});

const executeActionSchema = z.object({
  connection_id: z.string(),
  action: z.string(),
  params: z.record(z.any()).optional(),
});

export async function credentialRoutes(fastify: FastifyInstance) {
  
  // ==========================================================================
  // POST /v2/credentials
  // Create a new connection with credentials (stored in vault)
  // ==========================================================================
  fastify.post('/', {
    preHandler: [authMiddleware],
  }, async (request, reply) => {
    const body = createCredentialSchema.parse(request.body);
    const tenantId = request.tenantId!;
    const userId = request.userId!;

    // Generate unique connection ID
    const connectionId = generateSecureToken(16);

    // Store credentials in vault
    await storeCredential(tenantId, connectionId, body.provider, body.credentials);

    // Create credential record (no secrets stored here)
    const [credential] = await db
      .insert(credentials)
      .values({
        tenantId,
        connectionId,
        provider: body.provider,
        status: 'active',
      })
      .returning();

    // Log credential creation to compliance
    await db.insert(complianceEvents).values({
      tenantId,
      category: 'config_change',
      eventType: 'credential_created',
      refType: 'credential',
      refId: connectionId,
      actor: request.user!.email,
      actorType: 'user',
      payload: {
        provider: body.provider,
        connection_name: body.connection_name,
      },
      piiRedacted: true,
      digestSha256: '', // Computed by compliance job
      prevDigestSha256: null,
    });

    request.log.info({
      connection_id: connectionId,
      provider: body.provider,
      tenant_id: tenantId,
    }, 'Credential created');

    return reply.status(201).send({
      connection_id: connectionId,
      provider: body.provider,
      status: credential.status,
      created_at: credential.createdAt,
    });
  });

  // ==========================================================================
  // GET /v2/credentials
  // List all connections for tenant (no secrets returned)
  // ==========================================================================
  fastify.get('/', {
    preHandler: [authMiddleware],
  }, async (request, reply) => {
    const tenantId = request.tenantId!;

    const allCredentials = await db
      .select()
      .from(credentials)
      .where(eq(credentials.tenantId, tenantId))
      .orderBy(credentials.createdAt);

    return reply.send({
      connections: allCredentials.map(c => ({
        connection_id: c.connectionId,
        provider: c.provider,
        status: c.status,
        last_health_check: c.lastHealthCheck,
        created_at: c.createdAt,
      })),
    });
  });

  // ==========================================================================
  // POST /v2/credentials/:connectionId/test
  // Test connection health
  // ==========================================================================
  fastify.post('/:connectionId/test', {
    preHandler: [authMiddleware],
  }, async (request, reply) => {
    const { connectionId } = request.params as { connectionId: string };
    const tenantId = request.tenantId!;

    // Verify connection belongs to tenant
    const [credential] = await db
      .select()
      .from(credentials)
      .where(and(
        eq(credentials.connectionId, connectionId),
        eq(credentials.tenantId, tenantId)
      ))
      .limit(1);

    if (!credential) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Connection not found',
      });
    }

    // Get credentials from vault
    const creds = await getCredential(tenantId, connectionId);

    // Test connection
    const isHealthy = await testConnection(credential.provider, creds);

    // Update health check timestamp
    await db
      .update(credentials)
      .set({
        status: isHealthy ? 'active' : 'inactive',
        lastHealthCheck: new Date(),
      })
      .where(eq(credentials.id, credential.id));

    return reply.send({
      connection_id: connectionId,
      healthy: isHealthy,
      tested_at: new Date().toISOString(),
    });
  });

  // ==========================================================================
  // POST /v2/credentials/:connectionId/execute
  // Execute an action using this connection (server-side only)
  // ==========================================================================
  fastify.post('/:connectionId/execute', {
    preHandler: [authMiddleware],
  }, async (request, reply) => {
    const { connectionId } = request.params as { connectionId: string };
    const body = executeActionSchema.parse(request.body);
    const tenantId = request.tenantId!;

    // Verify connection belongs to tenant
    const [credential] = await db
      .select()
      .from(credentials)
      .where(and(
        eq(credentials.connectionId, connectionId),
        eq(credentials.tenantId, tenantId)
      ))
      .limit(1);

    if (!credential) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Connection not found',
      });
    }

    // Get credentials from vault
    const creds = await getCredential(tenantId, connectionId);

    // Execute action (server-side)
    // TODO: Implement actual provider-specific actions
    const result = {
      success: true,
      data: {},
      message: \`Action \${body.action} executed\`,
    };

    // Log action to compliance
    await db.insert(complianceEvents).values({
      tenantId,
      category: 'provider_call',
      eventType: \`\${credential.provider}_\${body.action}\`,
      refType: 'credential',
      refId: connectionId,
      actor: request.user!.email,
      actorType: 'user',
      payload: {
        action: body.action,
        params_hash: sha256(JSON.stringify(body.params || {})),
      },
      piiRedacted: true,
      digestSha256: '',
      prevDigestSha256: null,
    });

    return reply.send(result);
  });

  // ==========================================================================
  // DELETE /v2/credentials/:connectionId
  // Delete connection (crypto-shred credentials in vault)
  // ==========================================================================
  fastify.delete('/:connectionId', {
    preHandler: [authMiddleware],
  }, async (request, reply) => {
    const { connectionId } = request.params as { connectionId: string };
    const tenantId = request.tenantId!;

    // Verify connection belongs to tenant
    const [credential] = await db
      .select()
      .from(credentials)
      .where(and(
        eq(credentials.connectionId, connectionId),
        eq(credentials.tenantId, tenantId)
      ))
      .limit(1);

    if (!credential) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Connection not found',
      });
    }

    // Delete credentials from vault (crypto-shred)
    await deleteCredential(tenantId, connectionId);

    // Delete credential record
    await db
      .delete(credentials)
      .where(eq(credentials.id, credential.id));

    // Log deletion to compliance
    await db.insert(complianceEvents).values({
      tenantId,
      category: 'config_change',
      eventType: 'credential_deleted',
      refType: 'credential',
      refId: connectionId,
      actor: request.user!.email,
      actorType: 'user',
      payload: {
        provider: credential.provider,
      },
      piiRedacted: true,
      digestSha256: '',
      prevDigestSha256: null,
    });

    request.log.warn({
      connection_id: connectionId,
      provider: credential.provider,
    }, 'Credential deleted (crypto-shredded)');

    return reply.status(204).send();
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
              <h2 className="text-lg font-mono text-gray-700">src/routes/credentials.ts</h2>
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