import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle } from 'lucide-react';

export default function BackendCode_src_routes_workflows_ts() {
  const [copied, setCopied] = React.useState(false);
  
  const code = `// PATH: src/routes/workflows.ts
import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { db } from '../db.js';
import { runs, runLogs } from '../schema.js';
import { eq, and } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth.js';
import { acquireLock, releaseLock } from '../lib/locks.js';
import { checkIdempotency, setIdempotencyResult } from '../lib/idempotency.js';
import { generateSecureToken } from '../security/hash.js';

const triggerRunSchema = z.object({
  workflow_id: z.string().uuid(),
  trigger_type: z.enum(['webhook', 'schedule', 'manual']),
  trigger_payload: z.record(z.any()).optional(),
});

const cancelRunSchema = z.object({
  reason: z.string().optional(),
});

export async function workflowRoutes(fastify: FastifyInstance) {
  
  // ==========================================================================
  // POST /v2/workflows/trigger
  // ==========================================================================
  fastify.post('/trigger', {
    preHandler: [authMiddleware],
  }, async (request, reply) => {
    const body = triggerRunSchema.parse(request.body);
    const tenantId = request.tenantId!;
    const userId = request.userId!;
    
    // Extract idempotency key from header
    const idempotencyKey = request.headers['idempotency-key'] as string;
    if (!idempotencyKey) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Idempotency-Key header is required',
      });
    }

    // Check if this request was already processed
    const existingResult = await checkIdempotency(tenantId, idempotencyKey);
    if (existingResult) {
      request.log.info({ idempotency_key: idempotencyKey }, 'Idempotent request - returning cached result');
      return reply.status(existingResult.status_code).send(existingResult.response_body);
    }

    // Generate correlation ID for distributed tracing
    const correlationId = generateSecureToken(16);

    // Create run record
    const [run] = await db
      .insert(runs)
      .values({
        tenantId,
        workflowId: body.workflow_id,
        triggerType: body.trigger_type,
        triggerPayload: body.trigger_payload || {},
        status: 'pending',
        correlationId,
        idempotencyKey,
        createdBy: userId,
      })
      .returning();

    // Log run creation
    await db.insert(runLogs).values({
      tenantId,
      runId: run.id,
      logLevel: 'INFO',
      message: 'Workflow run triggered',
      payloadJson: {
        trigger_type: body.trigger_type,
        triggered_by: userId,
      },
    });

    const response = {
      run_id: run.id,
      correlation_id: correlationId,
      status: run.status,
      created_at: run.createdAt,
    };

    // Store idempotency result
    await setIdempotencyResult(tenantId, idempotencyKey, 202, response);

    request.log.info({
      run_id: run.id,
      workflow_id: body.workflow_id,
      correlation_id: correlationId,
    }, 'Workflow run created');

    return reply.status(202).send(response);
  });

  // ==========================================================================
  // GET /v2/workflows/runs/:runId
  // ==========================================================================
  fastify.get('/runs/:runId', {
    preHandler: [authMiddleware],
  }, async (request, reply) => {
    const { runId } = request.params as { runId: string };
    const tenantId = request.tenantId!;

    const [run] = await db
      .select()
      .from(runs)
      .where(and(
        eq(runs.id, runId),
        eq(runs.tenantId, tenantId)
      ))
      .limit(1);

    if (!run) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Run not found',
      });
    }

    // Fetch logs
    const logs = await db
      .select()
      .from(runLogs)
      .where(and(
        eq(runLogs.runId, runId),
        eq(runLogs.tenantId, tenantId)
      ))
      .orderBy(runLogs.timestamp);

    return reply.send({
      ...run,
      logs,
    });
  });

  // ==========================================================================
  // POST /v2/workflows/runs/:runId/cancel
  // ==========================================================================
  fastify.post('/runs/:runId/cancel', {
    preHandler: [authMiddleware],
  }, async (request, reply) => {
    const { runId } = request.params as { runId: string };
    const body = cancelRunSchema.parse(request.body);
    const tenantId = request.tenantId!;
    const userId = request.userId!;

    // Acquire lock to prevent race conditions
    const lockKey = \`run:\${runId}:cancel\`;
    const lockAcquired = await acquireLock(tenantId, lockKey, 30);

    if (!lockAcquired) {
      return reply.status(409).send({
        error: 'Conflict',
        message: 'Another operation is in progress for this run',
      });
    }

    try {
      // Update run status
      const [updatedRun] = await db
        .update(runs)
        .set({
          status: 'cancelled',
          finishedAt: new Date(),
        })
        .where(and(
          eq(runs.id, runId),
          eq(runs.tenantId, tenantId)
        ))
        .returning();

      if (!updatedRun) {
        return reply.status(404).send({
          error: 'Not Found',
          message: 'Run not found',
        });
      }

      // Log cancellation
      await db.insert(runLogs).values({
        tenantId,
        runId,
        logLevel: 'WARN',
        message: 'Run cancelled by user',
        payloadJson: {
          cancelled_by: userId,
          reason: body.reason,
        },
      });

      request.log.info({
        run_id: runId,
        cancelled_by: userId,
      }, 'Workflow run cancelled');

      return reply.send({
        run_id: updatedRun.id,
        status: updatedRun.status,
        finished_at: updatedRun.finishedAt,
      });

    } finally {
      await releaseLock(tenantId, lockKey);
    }
  });

  // ==========================================================================
  // POST /v2/workflows/runs/:runId/retry
  // ==========================================================================
  fastify.post('/runs/:runId/retry', {
    preHandler: [authMiddleware],
  }, async (request, reply) => {
    const { runId } = request.params as { runId: string };
    const tenantId = request.tenantId!;
    const userId = request.userId!;

    // Fetch original run
    const [originalRun] = await db
      .select()
      .from(runs)
      .where(and(
        eq(runs.id, runId),
        eq(runs.tenantId, tenantId)
      ))
      .limit(1);

    if (!originalRun) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Run not found',
      });
    }

    if (originalRun.status !== 'failed') {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Only failed runs can be retried',
      });
    }

    // Create new run with same parameters
    const correlationId = generateSecureToken(16);

    const [newRun] = await db
      .insert(runs)
      .values({
        tenantId,
        workflowId: originalRun.workflowId,
        triggerType: 'manual',
        triggerPayload: originalRun.triggerPayload,
        status: 'pending',
        correlationId,
        createdBy: userId,
      })
      .returning();

    // Log retry
    await db.insert(runLogs).values({
      tenantId,
      runId: newRun.id,
      logLevel: 'INFO',
      message: 'Workflow run retried',
      payloadJson: {
        original_run_id: runId,
        retried_by: userId,
      },
    });

    request.log.info({
      original_run_id: runId,
      new_run_id: newRun.id,
      retried_by: userId,
    }, 'Workflow run retried');

    return reply.status(202).send({
      run_id: newRun.id,
      original_run_id: runId,
      correlation_id: correlationId,
      status: newRun.status,
      created_at: newRun.createdAt,
    });
  });

  // ==========================================================================
  // GET /v2/workflows/runs (list with pagination)
  // ==========================================================================
  fastify.get('/runs', {
    preHandler: [authMiddleware],
  }, async (request, reply) => {
    const tenantId = request.tenantId!;
    const { status, limit = 50, offset = 0 } = request.query as any;

    let query = db
      .select()
      .from(runs)
      .where(eq(runs.tenantId, tenantId))
      .orderBy(runs.createdAt, 'desc')
      .limit(parseInt(limit))
      .offset(parseInt(offset));

    if (status) {
      query = query.where(and(
        eq(runs.tenantId, tenantId),
        eq(runs.status, status)
      ));
    }

    const results = await query;

    return reply.send({
      data: results,
      has_more: results.length === parseInt(limit),
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
              <h2 className="text-lg font-mono text-gray-700">src/routes/workflows.ts</h2>
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