import React from 'react';
import { Tenant } from '@/api/entities';

const PLAN_LIMITS = {
  starter: {
    max_workflows_enabled: 2,
    max_connections: 2,
    max_actions_month: 1000,
    slack_approvals: false,
    genome_apply: false,
    ledger_export: false
  },
  growth: {
    max_workflows_enabled: 5,
    max_connections: 5,
    max_actions_month: 10000,
    slack_approvals: true,
    genome_apply: true,
    ledger_export: false
  },
  scale: {
    max_workflows_enabled: -1,
    max_connections: -1,
    max_actions_month: -1,
    slack_approvals: true,
    genome_apply: true,
    ledger_export: true
  }
};

export async function checkPlanLimit(tenantId, limitName) {
  const tenant = await Tenant.get(tenantId);
  const limits = PLAN_LIMITS[tenant.plan || 'starter'];
  
  // Reset monthly counter if needed
  const currentMonth = new Date().toISOString().slice(0, 7);
  if (tenant.month_reset_date !== currentMonth) {
    await Tenant.update(tenantId, {
      actions_this_month: 0,
      month_reset_date: currentMonth
    });
    tenant.actions_this_month = 0;
  }
  
  const limit = limits[limitName];
  if (limit === -1) return { allowed: true };
  if (limit === false) return { allowed: false, reason: `Feature not available on ${tenant.plan} plan` };
  
  // Check specific limits
  if (limitName === 'max_actions_month') {
    if (tenant.actions_this_month >= limit) {
      return {
        allowed: false,
        reason: `Monthly action limit reached (${limit}). Upgrade to continue.`
      };
    }
  }
  
  return { allowed: true };
}

export async function incrementActionCounter(tenantId, count = 1) {
  const tenant = await Tenant.get(tenantId);
  await Tenant.update(tenantId, {
    actions_this_month: (tenant.actions_this_month || 0) + count
  });
}

export async function canEnableWorkflow(tenantId) {
  const tenant = await Tenant.get(tenantId);
  const limits = PLAN_LIMITS[tenant.plan || 'starter'];
  
  const { Workflow } = await import('@/api/entities');
  const enabledWorkflows = await Workflow.filter({
    tenant_id: tenantId,
    enabled: true
  });
  
  if (limits.max_workflows_enabled === -1) return { allowed: true };
  
  if (enabledWorkflows.length >= limits.max_workflows_enabled) {
    return {
      allowed: false,
      reason: `Maximum ${limits.max_workflows_enabled} workflows allowed on ${tenant.plan} plan`
    };
  }
  
  return { allowed: true };
}

export async function canAddConnection(tenantId) {
  const tenant = await Tenant.get(tenantId);
  const limits = PLAN_LIMITS[tenant.plan || 'starter'];
  
  const { Connection } = await import('@/api/entities');
  const connections = await Connection.filter({ tenant_id: tenantId });
  
  if (limits.max_connections === -1) return { allowed: true };
  
  if (connections.length >= limits.max_connections) {
    return {
      allowed: false,
      reason: `Maximum ${limits.max_connections} connections allowed on ${tenant.plan} plan`
    };
  }
  
  return { allowed: true };
}

export function PlanUpgradePrompt({ feature, currentPlan }) {
  const upgradeTo = currentPlan === 'starter' ? 'growth' : 'scale';
  
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <h3 className="font-semibold text-yellow-900 mb-2">Upgrade Required</h3>
      <p className="text-sm text-yellow-800 mb-3">
        {feature} is not available on the {currentPlan} plan.
      </p>
      <a href="/Billing" className="text-sm text-indigo-600 hover:underline">
        Upgrade to {upgradeTo} →
      </a>
    </div>
  );
}

export default { checkPlanLimit, incrementActionCounter, canEnableWorkflow, canAddConnection, PlanUpgradePrompt };