import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle } from 'lucide-react';

export default function BackendCode_src_routes_compliance_ts() {
  const [copied, setCopied] = React.useState(false);
  
  const code = `// PATH: src/routes/compliance.ts
import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db.js';
import { complianceEvents, complianceAnchors } from '../schema.js';
import { eq, and, desc, sql } from 'drizzle-orm';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';
import { sha256 } from '../security/hash.js';

const queryEventsSchema = z.object({
  category: z.string().optional(),
  from_date: z.string().datetime().optional(),
  to_date: z.string().datetime().optional(),
  limit: z.number().min(1).max(1000).default(100),
});

export async function complianceRoutes(fastify: FastifyInstance) {
  
  // ==========================================================================
  // GET /v2/compliance/events
  // Query compliance events for current tenant
  // ==========================================================================
  fastify.get('/events', {
    preHandler: [authMiddleware],
  }, async (request, reply) => {
    const query = queryEventsSchema.parse(request.query);
    const tenantId = request.tenantId!;

    let conditions = [eq(complianceEvents.tenantId, tenantId)];

    if (query.category) {
      conditions.push(eq(complianceEvents.category, query.category));
    }

    if (query.from_date) {
      conditions.push(sql\`\${complianceEvents.timestamp} >= \${query.from_date}\`);
    }

    if (query.to_date) {
      conditions.push(sql\`\${complianceEvents.timestamp} <= \${query.to_date}\`);
    }

    const events = await db
      .select()
      .from(complianceEvents)
      .where(and(...conditions))
      .orderBy(desc(complianceEvents.timestamp))
      .limit(query.limit);

    return reply.send({
      events: events.map(e => ({
        id: e.id,
        category: e.category,
        event_type: e.eventType,
        ref_type: e.refType,
        ref_id: e.refId,
        actor: e.actor,
        actor_type: e.actorType,
        timestamp: e.timestamp,
        digest: e.digestSha256,
        prev_digest: e.prevDigestSha256,
        pii_redacted: e.piiRedacted,
      })),
      total: events.length,
    });
  });

  // ==========================================================================
  // GET /v2/compliance/events/:eventId
  // Get specific event details
  // ==========================================================================
  fastify.get('/events/:eventId', {
    preHandler: [authMiddleware],
  }, async (request, reply) => {
    const { eventId } = request.params as { eventId: string };
    const tenantId = request.tenantId!;

    const [event] = await db
      .select()
      .from(complianceEvents)
      .where(and(
        eq(complianceEvents.id, eventId),
        eq(complianceEvents.tenantId, tenantId)
      ))
      .limit(1);

    if (!event) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Compliance event not found',
      });
    }

    return reply.send({
      id: event.id,
      category: event.category,
      event_type: event.eventType,
      ref_type: event.refType,
      ref_id: event.refId,
      actor: event.actor,
      actor_type: event.actorType,
      payload: event.payload,
      timestamp: event.timestamp,
      digest: event.digestSha256,
      prev_digest: event.prevDigestSha256,
      pii_redacted: event.piiRedacted,
    });
  });

  // ==========================================================================
  // POST /v2/compliance/verify-chain
  // Verify integrity of compliance event chain
  // ==========================================================================
  fastify.post('/verify-chain', {
    preHandler: [authMiddleware, requireAdmin],
  }, async (request, reply) => {
    const tenantId = request.tenantId!;

    // Fetch all events in order
    const events = await db
      .select()
      .from(complianceEvents)
      .where(eq(complianceEvents.tenantId, tenantId))
      .orderBy(complianceEvents.timestamp);

    const violations: Array<{
      event_id: string;
      expected_digest: string;
      actual_digest: string;
    }> = [];

    let prevDigest: string | null = null;

    for (const event of events) {
      // Verify prev_digest matches
      if (event.prevDigestSha256 !== prevDigest) {
        violations.push({
          event_id: event.id,
          expected_digest: prevDigest || 'null',
          actual_digest: event.prevDigestSha256 || 'null',
        });
      }

      // Recompute digest
      const dataToHash = JSON.stringify({
        category: event.category,
        event_type: event.eventType,
        ref_type: event.refType,
        ref_id: event.refId,
        actor: event.actor,
        actor_type: event.actorType,
        payload: event.payload,
        timestamp: event.timestamp,
      });

      const computedDigest = sha256(prevDigest || '' + dataToHash);

      // Verify digest matches
      if (computedDigest !== event.digestSha256) {
        violations.push({
          event_id: event.id,
          expected_digest: computedDigest,
          actual_digest: event.digestSha256,
        });
      }

      prevDigest = event.digestSha256;
    }

    return reply.send({
      chain_valid: violations.length === 0,
      total_events: events.length,
      violations_count: violations.length,
      violations,
    });
  });

  // ==========================================================================
  // GET /v2/compliance/anchors
  // Get Merkle anchors for compliance periods
  // ==========================================================================
  fastify.get('/anchors', {
    preHandler: [authMiddleware, requireAdmin],
  }, async (request, reply) => {
    const tenantId = request.tenantId!;

    const anchors = await db
      .select()
      .from(complianceAnchors)
      .where(eq(complianceAnchors.tenantId, tenantId))
      .orderBy(desc(complianceAnchors.computedAt))
      .limit(50);

    return reply.send({
      anchors: anchors.map(a => ({
        id: a.id,
        period: a.period,
        from_ts: a.fromTs,
        to_ts: a.toTs,
        anchor_sha256: a.anchorSha256,
        hmac_sha256: a.hmacSha256,
        event_count: a.eventCount,
        computed_at: a.computedAt,
      })),
    });
  });

  // ==========================================================================
  // GET /v2/compliance/export
  // Export compliance data for GDPR/audit
  // ==========================================================================
  fastify.get('/export', {
    preHandler: [authMiddleware, requireAdmin],
  }, async (request, reply) => {
    const tenantId = request.tenantId!;

    // Fetch all compliance events
    const events = await db
      .select()
      .from(complianceEvents)
      .where(eq(complianceEvents.tenantId, tenantId))
      .orderBy(complianceEvents.timestamp);

    // Fetch all anchors
    const anchors = await db
      .select()
      .from(complianceAnchors)
      .where(eq(complianceAnchors.tenantId, tenantId))
      .orderBy(complianceAnchors.computedAt);

    const exportData = {
      tenant_id: tenantId,
      exported_at: new Date().toISOString(),
      event_count: events.length,
      anchor_count: anchors.length,
      events: events.map(e => ({
        id: e.id,
        category: e.category,
        event_type: e.eventType,
        actor: e.actor,
        timestamp: e.timestamp,
        digest: e.digestSha256,
        prev_digest: e.prevDigestSha256,
      })),
      anchors: anchors.map(a => ({
        period: a.period,
        anchor_sha256: a.anchorSha256,
        event_count: a.eventCount,
        computed_at: a.computedAt,
      })),
    };

    reply.header('Content-Type', 'application/json');
    reply.header('Content-Disposition', \`attachment; filename="compliance-export-\${tenantId}-\${Date.now()}.json"\`);

    return reply.send(exportData);
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
              <h2 className="text-lg font-mono text-gray-700">src/routes/compliance.ts</h2>
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