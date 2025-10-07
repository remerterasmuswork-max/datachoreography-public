import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle } from 'lucide-react';

export default function BackendCode_src_routes_tenants_ts() {
  const [copied, setCopied] = React.useState(false);
  
  const code = `// PATH: src/routes/tenants.ts
import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db.js';
import { tenants } from '../schema.js';
import { eq } from 'drizzle-orm';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';

const createTenantSchema = z.object({
  name: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/),
});

const updateTenantSchema = z.object({
  name: z.string().min(1).optional(),
  settings: z.record(z.any()).optional(),
});

export async function tenantRoutes(fastify: FastifyInstance) {
  
  // ==========================================================================
  // GET /v2/tenants/me
  // Get current tenant info
  // ==========================================================================
  fastify.get('/me', {
    preHandler: [authMiddleware],
  }, async (request, reply) => {
    const tenantId = request.tenantId!;

    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (!tenant) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Tenant not found',
      });
    }

    return reply.send({
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      created_at: tenant.createdAt,
      settings: tenant.settings || {},
    });
  });

  // ==========================================================================
  // POST /v2/tenants
  // Create a new tenant (admin only)
  // ==========================================================================
  fastify.post('/', {
    preHandler: [authMiddleware, requireAdmin],
  }, async (request, reply) => {
    const body = createTenantSchema.parse(request.body);

    // Check if slug is taken
    const [existing] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.slug, body.slug))
      .limit(1);

    if (existing) {
      return reply.status(409).send({
        error: 'Conflict',
        message: 'Tenant slug already exists',
      });
    }

    // Create tenant
    const [tenant] = await db
      .insert(tenants)
      .values({
        name: body.name,
        slug: body.slug,
      })
      .returning();

    request.log.info({
      tenant_id: tenant.id,
      slug: body.slug,
    }, 'Tenant created');

    return reply.status(201).send({
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      created_at: tenant.createdAt,
    });
  });

  // ==========================================================================
  // GET /v2/tenants
  // List all tenants (admin only)
  // ==========================================================================
  fastify.get('/', {
    preHandler: [authMiddleware, requireAdmin],
  }, async (request, reply) => {
    const allTenants = await db
      .select()
      .from(tenants)
      .orderBy(tenants.createdAt);

    return reply.send({
      tenants: allTenants.map(t => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        created_at: t.createdAt,
      })),
    });
  });

  // ==========================================================================
  // PATCH /v2/tenants/:tenantId
  // Update tenant (admin only)
  // ==========================================================================
  fastify.patch('/:tenantId', {
    preHandler: [authMiddleware, requireAdmin],
  }, async (request, reply) => {
    const { tenantId } = request.params as { tenantId: string };
    const body = updateTenantSchema.parse(request.body);

    const [tenant] = await db
      .update(tenants)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, tenantId))
      .returning();

    if (!tenant) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Tenant not found',
      });
    }

    request.log.info({
      tenant_id: tenantId,
    }, 'Tenant updated');

    return reply.send({
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      settings: tenant.settings,
      updated_at: tenant.updatedAt,
    });
  });

  // ==========================================================================
  // DELETE /v2/tenants/:tenantId
  // Delete tenant (admin only, dangerous!)
  // ==========================================================================
  fastify.delete('/:tenantId', {
    preHandler: [authMiddleware, requireAdmin],
  }, async (request, reply) => {
    const { tenantId } = request.params as { tenantId: string };

    // Prevent deleting your own tenant
    if (tenantId === request.tenantId) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Cannot delete your own tenant',
      });
    }

    await db
      .delete(tenants)
      .where(eq(tenants.id, tenantId));

    request.log.warn({
      tenant_id: tenantId,
      deleted_by: request.userId,
    }, 'Tenant deleted');

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
              <h2 className="text-lg font-mono text-gray-700">src/routes/tenants.ts</h2>
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