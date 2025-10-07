/**
 * TenantFilter: Audit utility to detect unscoped entity queries
 * Run this in dev mode to catch tenant isolation violations
 */

import { User } from '@/api/entities';

// Track all entity operations
const auditLog = [];
let auditEnabled = false;

/**
 * Enable audit mode - logs all entity operations
 */
export function enableTenantAudit() {
  auditEnabled = true;
  auditLog.length = 0;
  console.log('🔍 Tenant audit enabled');
}

/**
 * Disable audit mode and return results
 */
export function disableTenantAudit() {
  auditEnabled = false;
  return [...auditLog];
}

/**
 * Log entity operation for audit
 */
export function logEntityOperation(entity, operation, filters) {
  if (!auditEnabled) return;
  
  const hasTenantFilter = filters && ('tenant_id' in filters);
  const isTenantEntity = entity === 'Tenant' || entity === 'User';
  const isGlobalEntity = ['AgentSkill', 'AgentSkillVersion'].includes(entity);
  
  auditLog.push({
    timestamp: Date.now(),
    entity,
    operation,
    filters,
    hasTenantFilter,
    safe: hasTenantFilter || isTenantEntity || isGlobalEntity,
    stackTrace: new Error().stack
  });
}

/**
 * Analyze audit results
 */
export function analyzeTenantAudit() {
  const violations = auditLog.filter(log => !log.safe);
  
  const report = {
    totalOperations: auditLog.length,
    violations: violations.length,
    violationsByEntity: violations.reduce((acc, v) => {
      acc[v.entity] = (acc[v.entity] || 0) + 1;
      return acc;
    }, {}),
    details: violations.map(v => ({
      entity: v.entity,
      operation: v.operation,
      filters: v.filters,
      stack: v.stackTrace.split('\n').slice(1, 4).join('\n')
    }))
  };
  
  return report;
}

/**
 * Wrapper to enforce tenant filtering
 * ONLY use this for entities that MUST have tenant_id
 */
export function enforceTenantFilter(entityName, operation, filters) {
  const isTenantEntity = entityName === 'Tenant' || entityName === 'User';
  const isGlobalEntity = ['AgentSkill', 'AgentSkillVersion'].includes(entityName);
  
  if (!isTenantEntity && !isGlobalEntity) {
    if (!filters || !('tenant_id' in filters)) {
      throw new Error(
        `TENANT ISOLATION VIOLATION: ${entityName}.${operation} called without tenant_id filter.\n` +
        `Use TenantEntity.wrap(${entityName}) instead of direct entity access.`
      );
    }
  }
  
  logEntityOperation(entityName, operation, filters);
}

export default {
  enableTenantAudit,
  disableTenantAudit,
  analyzeTenantAudit,
  enforceTenantFilter,
  logEntityOperation
};