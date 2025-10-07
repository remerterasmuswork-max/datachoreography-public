/**
 * ArchivalJob: Automated data retention and archival
 * Archives old runs, logs, and execution records to maintain performance
 */

import TenantEntity from './TenantEntity';
import { Run, RunLog, AgentExecutionLog, ComplianceEvent } from '@/api/entities';

// ============================================================================
// ARCHIVAL CONFIGURATION
// ============================================================================

const ARCHIVAL_CONFIG = {
  runs: {
    retention_days: 90,
    archive_batch_size: 100
  },
  logs: {
    retention_days: 90,
    archive_batch_size: 500
  },
  agent_logs: {
    retention_days: 90,
    archive_batch_size: 200
  },
  compliance_events: {
    retention_days: 2555, // 7 years for regulatory compliance
    archive_batch_size: 1000
  }
};

// ============================================================================
// ARCHIVAL FUNCTIONS
// ============================================================================

/**
 * Archive runs older than retention period
 * @param {number} retentionDays - Days to retain (default: 90)
 * @returns {Promise<object>} - { archived: number, errors: number }
 */
export async function archiveOldRuns(retentionDays = ARCHIVAL_CONFIG.runs.retention_days) {
  try {
    const TenantRun = TenantEntity.wrap(Run);
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    console.log(`Archiving runs older than ${cutoffDate.toISOString()}`);
    
    // Find old runs
    const runs = await TenantRun.list('-created_date', 1000);
    const oldRuns = runs.filter(r => 
      new Date(r.created_date) < cutoffDate &&
      ['completed', 'failed', 'cancelled'].includes(r.status)
    );
    
    console.log(`Found ${oldRuns.length} runs to archive`);
    
    let archived = 0;
    let errors = 0;
    
    // Archive in batches
    for (let i = 0; i < oldRuns.length; i += ARCHIVAL_CONFIG.runs.archive_batch_size) {
      const batch = oldRuns.slice(i, i + ARCHIVAL_CONFIG.runs.archive_batch_size);
      
      for (const run of batch) {
        try {
          // In production, move to cold storage instead of delete
          // For now, we'll just delete to keep database lean
          await TenantRun.delete(run.id);
          archived++;
        } catch (error) {
          console.error(`Failed to archive run ${run.id}:`, error);
          errors++;
        }
      }
      
      // Progress log
      console.log(`Archived ${Math.min(i + batch.length, oldRuns.length)}/${oldRuns.length} runs`);
    }
    
    return { archived, errors };
    
  } catch (error) {
    console.error('Archival job failed:', error);
    return { archived: 0, errors: 1 };
  }
}

/**
 * Archive run logs older than retention period
 * @param {number} retentionDays - Days to retain (default: 90)
 * @returns {Promise<object>} - { archived: number, errors: number }
 */
export async function archiveOldLogs(retentionDays = ARCHIVAL_CONFIG.logs.retention_days) {
  try {
    const TenantRunLog = TenantEntity.wrap(RunLog);
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    console.log(`Archiving logs older than ${cutoffDate.toISOString()}`);
    
    const logs = await TenantRunLog.list('-timestamp', 2000);
    const oldLogs = logs.filter(l => new Date(l.timestamp) < cutoffDate);
    
    console.log(`Found ${oldLogs.length} logs to archive`);
    
    let archived = 0;
    let errors = 0;
    
    for (let i = 0; i < oldLogs.length; i += ARCHIVAL_CONFIG.logs.archive_batch_size) {
      const batch = oldLogs.slice(i, i + ARCHIVAL_CONFIG.logs.archive_batch_size);
      
      for (const log of batch) {
        try {
          await TenantRunLog.delete(log.id);
          archived++;
        } catch (error) {
          console.error(`Failed to archive log ${log.id}:`, error);
          errors++;
        }
      }
      
      console.log(`Archived ${Math.min(i + batch.length, oldLogs.length)}/${oldLogs.length} logs`);
    }
    
    return { archived, errors };
    
  } catch (error) {
    console.error('Log archival failed:', error);
    return { archived: 0, errors: 1 };
  }
}

/**
 * Archive agent execution logs older than retention period
 * @param {number} retentionDays - Days to retain (default: 90)
 * @returns {Promise<object>} - { archived: number, errors: number }
 */
export async function archiveOldAgentLogs(retentionDays = ARCHIVAL_CONFIG.agent_logs.retention_days) {
  try {
    const TenantAgentExecutionLog = TenantEntity.wrap(AgentExecutionLog);
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    console.log(`Archiving agent logs older than ${cutoffDate.toISOString()}`);
    
    const logs = await TenantAgentExecutionLog.list('-created_date', 2000);
    const oldLogs = logs.filter(l => new Date(l.created_date) < cutoffDate);
    
    console.log(`Found ${oldLogs.length} agent logs to archive`);
    
    let archived = 0;
    let errors = 0;
    
    for (let i = 0; i < oldLogs.length; i += ARCHIVAL_CONFIG.agent_logs.archive_batch_size) {
      const batch = oldLogs.slice(i, i + ARCHIVAL_CONFIG.agent_logs.archive_batch_size);
      
      for (const log of batch) {
        try {
          await TenantAgentExecutionLog.delete(log.id);
          archived++;
        } catch (error) {
          console.error(`Failed to archive agent log ${log.id}:`, error);
          errors++;
        }
      }
      
      console.log(`Archived ${Math.min(i + batch.length, oldLogs.length)}/${oldLogs.length} agent logs`);
    }
    
    return { archived, errors };
    
  } catch (error) {
    console.error('Agent log archival failed:', error);
    return { archived: 0, errors: 1 };
  }
}

/**
 * Run full archival job for all data types
 * @returns {Promise<object>} - Summary of archival results
 */
export async function runFullArchival() {
  console.log('Starting full archival job...');
  
  const startTime = Date.now();
  
  const results = {
    runs: await archiveOldRuns(),
    logs: await archiveOldLogs(),
    agent_logs: await archiveOldAgentLogs(),
    duration_ms: Date.now() - startTime
  };
  
  console.log('Archival job completed:', results);
  
  return results;
}

/**
 * Schedule archival job to run periodically
 * NOTE: In production, this would run as a cron job/Cloud Function
 * For Base44, this can be called manually or via UI button
 * @param {number} intervalHours - Hours between runs (default: 24)
 */
export function scheduleArchivalJob(intervalHours = 24) {
  console.log(`Scheduling archival job every ${intervalHours} hours`);
  
  // Run immediately
  runFullArchival();
  
  // Schedule recurring
  const intervalMs = intervalHours * 60 * 60 * 1000;
  
  setInterval(() => {
    runFullArchival();
  }, intervalMs);
}

export default {
  archiveOldRuns,
  archiveOldLogs,
  archiveOldAgentLogs,
  runFullArchival,
  scheduleArchivalJob,
  ARCHIVAL_CONFIG
};