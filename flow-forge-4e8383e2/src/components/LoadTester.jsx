/**
 * LoadTester: Production-safe stress testing utility
 * CRITICAL: Only run in dedicated test environments
 */

import TenantEntity, { getCurrentTenantId } from './TenantEntity';
import { Run, RunLog, MetricEvent } from '@/api/entities';
import { v4 as uuidv4 } from 'uuid';

/**
 * Simulates workflow execution load
 * @param {number} numRuns - Number of test runs to create
 * @param {object} options - Configuration options
 * @returns {Promise<object>} - Test results and stats
 */
export async function simulateLoad(numRuns = 100, options = {}) {
  const {
    batchSize = 10,
    delayBetweenBatchesMs = 100,
    testWorkflowId = 'load-test-workflow',
    safetyMode = true, // If true, marks all as simulations
    cleanupAfter = true
  } = options;

  // Safety check: prevent accidental production pollution
  if (safetyMode) {
    const confirmed = window.confirm(
      `⚠️ LOAD TEST WARNING ⚠️\n\n` +
      `You are about to create ${numRuns} test workflow runs.\n` +
      `This may impact platform performance.\n\n` +
      `Continue only if you are in a TEST environment.`
    );
    if (!confirmed) {
      return { cancelled: true };
    }
  }

  const batchId = uuidv4();
  const tenantId = await getCurrentTenantId();
  const startTime = Date.now();
  
  const results = {
    batchId,
    numRuns,
    created: [],
    errors: [],
    startTime: new Date().toISOString(),
    durationMs: 0
  };

  try {
    const TenantRun = TenantEntity.wrap(Run);
    const TenantRunLog = TenantEntity.wrap(RunLog);

    // Create runs in batches
    const numBatches = Math.ceil(numRuns / batchSize);
    
    for (let batch = 0; batch < numBatches; batch++) {
      const batchStart = Date.now();
      const batchRuns = Math.min(batchSize, numRuns - (batch * batchSize));
      
      // Create batch concurrently
      const batchPromises = Array(batchRuns).fill().map(async (_, idx) => {
        try {
          const runNumber = (batch * batchSize) + idx + 1;
          
          // Create test run
          const run = await TenantRun.create({
            workflow_id: testWorkflowId,
            status: 'pending',
            trigger_type: 'manual',
            is_simulation: true, // CRITICAL: Mark as simulation
            correlation_id: `${batchId}-${runNumber}`,
            context: {
              load_test: true,
              batch_id: batchId,
              run_number: runNumber
            },
            tags: ['load-test', `batch-${batchId}`]
          });

          // Create sample log
          await TenantRunLog.create({
            run_id: run.id,
            log_level: 'INFO',
            message: `Load test run ${runNumber} created`,
            timestamp: new Date().toISOString()
          });

          results.created.push(run.id);
          
        } catch (error) {
          results.errors.push({
            runNumber: (batch * batchSize) + idx + 1,
            error: error.message
          });
        }
      });

      await Promise.all(batchPromises);
      
      // Log batch completion
      console.log(`Batch ${batch + 1}/${numBatches} complete (${batchRuns} runs in ${Date.now() - batchStart}ms)`);
      
      // Delay between batches to avoid overwhelming API
      if (batch < numBatches - 1) {
        await sleep(delayBetweenBatchesMs);
      }
    }

    results.durationMs = Date.now() - startTime;
    results.endTime = new Date().toISOString();
    results.runsPerSecond = (results.created.length / (results.durationMs / 1000)).toFixed(2);

    // Log metrics
    const TenantMetricEvent = TenantEntity.wrap(MetricEvent);
    await TenantMetricEvent.create({
      metric_name: 'load_test_completed',
      metric_value: results.created.length,
      metric_unit: 'count',
      dimensions: {
        batch_id: batchId,
        duration_ms: results.durationMs,
        runs_per_second: parseFloat(results.runsPerSecond)
      },
      timestamp: new Date().toISOString()
    });

    // Auto-cleanup if requested
    if (cleanupAfter) {
      console.log('Starting cleanup...');
      const cleanupResults = await cleanupLoadTestData(batchId);
      results.cleanup = cleanupResults;
    }

    return results;

  } catch (error) {
    results.criticalError = error.message;
    results.durationMs = Date.now() - startTime;
    return results;
  }
}

/**
 * Cleanup test data
 * @param {string} batchId - Batch ID to cleanup (optional, cleans all if not provided)
 * @returns {Promise<object>} - Cleanup results
 */
export async function cleanupLoadTestData(batchId = null) {
  const results = {
    runsDeleted: 0,
    logsDeleted: 0,
    metricsDeleted: 0,
    failed: [],
    durationMs: 0
  };

  const startTime = Date.now();

  try {
    const TenantRun = TenantEntity.wrap(Run);
    const TenantRunLog = TenantEntity.wrap(RunLog);
    const TenantMetricEvent = TenantEntity.wrap(MetricEvent);

    // Find test runs
    const filter = batchId 
      ? { 'context.load_test': true, 'context.batch_id': batchId }
      : { 'context.load_test': true };
    
    const testRuns = await TenantRun.filter(filter, null, 1000);

    console.log(`Found ${testRuns.length} test runs to clean up`);

    // Delete runs and their logs
    for (const run of testRuns) {
      try {
        // Delete logs first
        const logs = await TenantRunLog.filter({ run_id: run.id });
        for (const log of logs) {
          await TenantRunLog.delete(log.id);
          results.logsDeleted++;
        }

        // Delete run
        await TenantRun.delete(run.id);
        results.runsDeleted++;

      } catch (error) {
        results.failed.push({
          runId: run.id,
          error: error.message
        });
      }
    }

    // Delete load test metrics
    const testMetrics = await TenantMetricEvent.filter({
      metric_name: 'load_test_completed'
    });
    
    for (const metric of testMetrics) {
      if (!batchId || metric.dimensions?.batch_id === batchId) {
        try {
          await TenantMetricEvent.delete(metric.id);
          results.metricsDeleted++;
        } catch (error) {
          results.failed.push({
            metricId: metric.id,
            error: error.message
          });
        }
      }
    }

    results.durationMs = Date.now() - startTime;
    results.success = results.failed.length === 0;

    console.log('Cleanup complete:', results);
    return results;

  } catch (error) {
    results.criticalError = error.message;
    results.durationMs = Date.now() - startTime;
    return results;
  }
}

/**
 * Sleep utility
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Verify platform capacity
 * @returns {Promise<object>} - Capacity stats
 */
export async function verifyCapacity() {
  const TenantRun = TenantEntity.wrap(Run);
  const TenantMetricEvent = TenantEntity.wrap(MetricEvent);

  const runs = await TenantRun.list(null, 1000);
  const metrics = await TenantMetricEvent.list(null, 100);

  return {
    totalRuns: runs.length,
    recentMetrics: metrics.length,
    loadTestRuns: runs.filter(r => r.context?.load_test).length,
    recommendedLoadSize: runs.length < 500 ? 100 : 50,
    warning: runs.length > 800 ? 'High entity count - consider archival' : null
  };
}

export default {
  simulateLoad,
  cleanupLoadTestData,
  verifyCapacity
};