import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle } from 'lucide-react';

export default function BackendCode_src_routes_metrics_ts() {
  const [copied, setCopied] = React.useState(false);
  
  const code = `// PATH: src/routes/metrics.ts
import { Router } from 'express';
import { db } from '../db.js';
import { metricAggregations, runs, workflows } from '../schema.js';
import { authMiddleware } from '../middleware/auth.js';
import { rlsMiddleware } from '../middleware/rls.js';
import { eq, and, gte, lte, sql, desc } from 'drizzle-orm';

const router = Router();

// ========================================
// PROTECTED: Get Dashboard Metrics
// ========================================

router.get('/dashboard', authMiddleware, rlsMiddleware, async (req, res) => {
  try {
    const tenantId = req.rlsContext.tenantId;
    const { period = 'last_30_days' } = req.query;

    const dateRange = getDateRange(period as string);

    // Fetch active workflows
    const activeWorkflows = await db
      .select({ count: sql<number>\`count(*)\` })
      .from(workflows)
      .where(
        and(
          eq(workflows.tenantId, tenantId),
          eq(workflows.enabled, true)
        )
      );

    // Fetch runs in period
    const periodRuns = await db
      .select()
      .from(runs)
      .where(
        and(
          eq(runs.tenantId, tenantId),
          gte(runs.startedAt, dateRange.start),
          lte(runs.startedAt, dateRange.end)
        )
      );

    // Calculate metrics
    const completedRuns = periodRuns.filter(r => r.status === 'completed');
    const failedRuns = periodRuns.filter(r => r.status === 'failed');

    const successRate = periodRuns.length > 0
      ? (completedRuns.length / periodRuns.length) * 100
      : 0;

    const avgDuration = completedRuns.length > 0
      ? completedRuns.reduce((sum, r) => sum + (r.durationMs || 0), 0) / completedRuns.length
      : 0;

    // Estimate time saved (15 min per task)
    const hoursSaved = Math.round((completedRuns.length * 15) / 60);

    // Estimate revenue processed (extract from context)
    let revenueProcessed = 0;
    for (const run of completedRuns) {
      const amount = run.context?.order?.total_amount ||
                    run.context?.invoice?.total_amount ||
                    run.context?.payment?.amount || 0;
      revenueProcessed += parseFloat(amount) || 0;
    }

    res.json({
      metrics: {
        active_workflows: activeWorkflows[0].count,
        tasks_automated: completedRuns.length,
        hours_saved: hoursSaved,
        revenue_processed: Math.round(revenueProcessed),
        success_rate: parseFloat(successRate.toFixed(2)),
        avg_duration_ms: Math.round(avgDuration),
        total_runs: periodRuns.length,
        failed_runs: failedRuns.length,
      },
      period: {
        start: dateRange.start.toISOString(),
        end: dateRange.end.toISOString(),
      },
    });
  } catch (error) {
    console.error('Failed to fetch dashboard metrics:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

// ========================================
// PROTECTED: Get Trend Data
// ========================================

router.get('/trends', authMiddleware, rlsMiddleware, async (req, res) => {
  try {
    const tenantId = req.rlsContext.tenantId;
    const { metric, period = 'daily', days = 30 } = req.query;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days as string));

    // Fetch aggregations
    const aggregations = await db
      .select()
      .from(metricAggregations)
      .where(
        and(
          eq(metricAggregations.tenantId, tenantId),
          eq(metricAggregations.metricName, metric as string),
          eq(metricAggregations.period, period as string),
          gte(metricAggregations.periodStart, startDate),
          lte(metricAggregations.periodStart, endDate)
        )
      )
      .orderBy(metricAggregations.periodStart);

    res.json({
      metric,
      period,
      data: aggregations.map(a => ({
        date: a.periodStart,
        value: parseFloat(a.value),
        unit: a.unit,
      })),
    });
  } catch (error) {
    console.error('Failed to fetch trend data:', error);
    res.status(500).json({ error: 'Failed to fetch trend data' });
  }
});

// ========================================
// PROTECTED: Get Workflow Metrics
// ========================================

router.get('/workflows/:workflowId', authMiddleware, rlsMiddleware, async (req, res) => {
  try {
    const { workflowId } = req.params;
    const tenantId = req.rlsContext.tenantId;

    // Verify workflow ownership
    const [workflow] = await db
      .select()
      .from(workflows)
      .where(
        and(
          eq(workflows.id, workflowId),
          eq(workflows.tenantId, tenantId)
        )
      )
      .limit(1);

    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' });
    }

    // Fetch workflow runs
    const workflowRuns = await db
      .select()
      .from(runs)
      .where(eq(runs.workflowId, workflowId))
      .orderBy(desc(runs.startedAt))
      .limit(100);

    const completedRuns = workflowRuns.filter(r => r.status === 'completed');
    const successRate = workflowRuns.length > 0
      ? (completedRuns.length / workflowRuns.length) * 100
      : 0;

    const avgDuration = completedRuns.length > 0
      ? completedRuns.reduce((sum, r) => sum + (r.durationMs || 0), 0) / completedRuns.length
      : 0;

    res.json({
      workflow: {
        id: workflow.id,
        name: workflow.displayName,
        enabled: workflow.enabled,
      },
      metrics: {
        total_runs: workflowRuns.length,
        completed: completedRuns.length,
        failed: workflowRuns.filter(r => r.status === 'failed').length,
        success_rate: parseFloat(successRate.toFixed(2)),
        avg_duration_ms: Math.round(avgDuration),
      },
      recent_runs: workflowRuns.slice(0, 10).map(r => ({
        id: r.id,
        status: r.status,
        started_at: r.startedAt,
        duration_ms: r.durationMs,
      })),
    });
  } catch (error) {
    console.error('Failed to fetch workflow metrics:', error);
    res.status(500).json({ error: 'Failed to fetch workflow metrics' });
  }
});

// ========================================
// PROTECTED: Emit Custom Metric
// ========================================

router.post('/emit', authMiddleware, rlsMiddleware, async (req, res) => {
  try {
    const tenantId = req.rlsContext.tenantId;
    const { metric_name, value, unit, dimensions } = req.body;

    const period = 'daily';
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const periodEnd = new Date(periodStart);
    periodEnd.setDate(periodEnd.getDate() + 1);

    // Upsert aggregation
    await db
      .insert(metricAggregations)
      .values({
        tenantId,
        metricName: metric_name,
        period,
        periodStart,
        periodEnd,
        value: value.toString(),
        unit,
        dimensions,
      })
      .onConflictDoUpdate({
        target: [
          metricAggregations.tenantId,
          metricAggregations.metricName,
          metricAggregations.period,
          metricAggregations.periodStart,
        ],
        set: {
          value: sql\`\${metricAggregations.value} + \${value}\`,
        },
      });

    res.json({ message: 'Metric emitted successfully' });
  } catch (error) {
    console.error('Failed to emit metric:', error);
    res.status(500).json({ error: 'Failed to emit metric' });
  }
});

// ========================================
// Helper: Get Date Range
// ========================================

function getDateRange(period: string): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();

  switch (period) {
    case 'last_7_days':
      start.setDate(start.getDate() - 7);
      break;
    case 'last_30_days':
      start.setDate(start.getDate() - 30);
      break;
    case 'last_90_days':
      start.setDate(start.getDate() - 90);
      break;
    case 'this_month':
      start.setDate(1);
      break;
    case 'last_month':
      start.setMonth(start.getMonth() - 1);
      start.setDate(1);
      end.setDate(0); // Last day of previous month
      break;
    default:
      start.setDate(start.getDate() - 30);
  }

  return { start, end };
}

export default router;`;

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
              <h2 className="text-lg font-mono text-gray-700">src/routes/metrics.ts</h2>
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