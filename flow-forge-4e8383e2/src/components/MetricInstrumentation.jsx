/**
 * MetricInstrumentation: Complete observability suite
 */

import TenantEntity from './TenantEntity';
import { MetricEvent, Run, RunLog, Approval, AgentExecutionLog } from '@/api/entities';

/**
 * Record all metrics for a completed run
 */
export async function recordRunMetrics(run) {
  const TenantMetricEvent = TenantEntity.wrap(MetricEvent);
  const timestamp = new Date().toISOString();

  // 1. Time to First Run (TTFR)
  const createdTime = new Date(run.created_date).getTime();
  const startedTime = new Date(run.started_at).getTime();
  const ttfr = startedTime - createdTime;
  
  await TenantMetricEvent.create({
    metric_name: 'ttfr',
    metric_value: ttfr,
    metric_unit: 'ms',
    dimensions: { workflow_id: run.workflow_id },
    timestamp
  });

  // 2. Run Duration
  if (run.duration_ms) {
    await TenantMetricEvent.create({
      metric_name: 'run_duration',
      metric_value: run.duration_ms,
      metric_unit: 'ms',
      dimensions: { 
        workflow_id: run.workflow_id,
        status: run.status
      },
      timestamp
    });
  }

  // 3. Auto-Resolution (success without manual intervention)
  const autoResolved = run.status === 'completed' && !run.workflow_id?.includes('manual');
  await TenantMetricEvent.create({
    metric_name: 'auto_resolution',
    metric_value: autoResolved ? 1 : 0,
    metric_unit: 'boolean',
    dimensions: { workflow_id: run.workflow_id },
    timestamp
  });

  // 4. Guardrail Violations
  if (run.guardrail_blocks && run.guardrail_blocks.length > 0) {
    await TenantMetricEvent.create({
      metric_name: 'guardrail_violations',
      metric_value: run.guardrail_blocks.length,
      metric_unit: 'count',
      dimensions: { 
        workflow_id: run.workflow_id,
        violations: run.guardrail_blocks.join(',')
      },
      timestamp
    });
  }

  // 5. Retry Count
  const retryCount = run.context?.retry_count || 0;
  if (retryCount > 0) {
    await TenantMetricEvent.create({
      metric_name: 'retry_count',
      metric_value: retryCount,
      metric_unit: 'count',
      dimensions: { workflow_id: run.workflow_id },
      timestamp
    });
  }

  // 6. API Call Count
  if (run.actions_count) {
    await TenantMetricEvent.create({
      metric_name: 'api_calls',
      metric_value: run.actions_count,
      metric_unit: 'count',
      dimensions: { workflow_id: run.workflow_id },
      timestamp
    });
  }

  // 7. Error Rate by Step
  const TenantRunLog = TenantEntity.wrap(RunLog);
  const logs = await TenantRunLog.filter({ run_id: run.id });
  const errorLogs = logs.filter(l => l.log_level === 'ERROR');
  
  if (errorLogs.length > 0) {
    for (const errorLog of errorLogs) {
      await TenantMetricEvent.create({
        metric_name: 'step_error',
        metric_value: 1,
        metric_unit: 'count',
        dimensions: {
          workflow_id: run.workflow_id,
          step: errorLog.message.split(':')[0] // Extract step name
        },
        timestamp: errorLog.timestamp
      });
    }
  }
}

/**
 * Record approval metrics
 */
export async function recordApprovalMetrics(approval) {
  if (approval.state !== 'pending') {
    const TenantMetricEvent = TenantEntity.wrap(MetricEvent);
    
    // Approval wait time
    const requestedTime = new Date(approval.requested_at).getTime();
    const respondedTime = new Date(approval.responded_at).getTime();
    const waitTime = respondedTime - requestedTime;
    
    await TenantMetricEvent.create({
      metric_name: 'approval_wait_time',
      metric_value: waitTime,
      metric_unit: 'ms',
      dimensions: {
        state: approval.state,
        run_id: approval.run_id
      },
      timestamp: approval.responded_at
    });

    // Approval rate
    await TenantMetricEvent.create({
      metric_name: 'approval_decision',
      metric_value: approval.state === 'approved' ? 1 : 0,
      metric_unit: 'boolean',
      dimensions: {
        run_id: approval.run_id
      },
      timestamp: approval.responded_at
    });
  }
}

/**
 * Record skill execution metrics
 */
export async function recordSkillMetrics(executionLog) {
  const TenantMetricEvent = TenantEntity.wrap(MetricEvent);
  const timestamp = new Date().toISOString();

  // Skill duration
  if (executionLog.duration_ms) {
    await TenantMetricEvent.create({
      metric_name: 'skill_duration',
      metric_value: executionLog.duration_ms,
      metric_unit: 'ms',
      dimensions: {
        skill_id: executionLog.skill_id,
        status: executionLog.status
      },
      timestamp: executionLog.finished_at || timestamp
    });
  }

  // Skill success rate
  await TenantMetricEvent.create({
    metric_name: 'skill_success',
    metric_value: executionLog.status === 'success' ? 1 : 0,
    metric_unit: 'boolean',
    dimensions: {
      skill_id: executionLog.skill_id
    },
    timestamp: executionLog.finished_at || timestamp
  });

  // API calls made by skill
  if (executionLog.api_calls_made) {
    await TenantMetricEvent.create({
      metric_name: 'skill_api_calls',
      metric_value: executionLog.api_calls_made,
      metric_unit: 'count',
      dimensions: {
        skill_id: executionLog.skill_id
      },
      timestamp: executionLog.finished_at || timestamp
    });
  }
}

/**
 * Calculate aggregate metrics
 */
export async function calculateAggregateMetrics(metricName, timeRangeHours = 24) {
  const TenantMetricEvent = TenantEntity.wrap(MetricEvent);
  
  const cutoff = new Date(Date.now() - timeRangeHours * 60 * 60 * 1000).toISOString();
  const events = await TenantMetricEvent.list('-timestamp', 10000);
  const recentEvents = events.filter(e => 
    e.metric_name === metricName && e.timestamp >= cutoff
  );

  if (recentEvents.length === 0) {
    return null;
  }

  const values = recentEvents.map(e => e.metric_value);
  
  return {
    count: values.length,
    avg: values.reduce((sum, v) => sum + v, 0) / values.length,
    min: Math.min(...values),
    max: Math.max(...values),
    p50: percentile(values, 50),
    p95: percentile(values, 95),
    p99: percentile(values, 99)
  };
}

function percentile(values, p) {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

export default {
  recordRunMetrics,
  recordApprovalMetrics,
  recordSkillMetrics,
  calculateAggregateMetrics
};