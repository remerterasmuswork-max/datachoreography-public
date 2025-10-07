/**
 * PlanEnforcement: Check and enforce subscription plan limits
 */

import { Tenant } from '@/api/entities';
import { getCurrentTenantId } from './TenantEntity';

const PLAN_LIMITS = {
  starter: {
    max_workflows: 2,
    max_connections: 2,
    max_actions_per_month: 1000,
    genome_readonly: true,
    genome_apply: false,
    slack_approvals: false,
    ledger_export: false
  },
  growth: {
    max_workflows: 5,
    max_connections: 5,
    max_actions_per_month: 10000,
    genome_readonly: true,
    genome_apply: true,
    slack_approvals: true,
    ledger_export: false
  },
  scale: {
    max_workflows: -1, // unlimited
    max_connections: -1,
    max_actions_per_month: -1,
    genome_readonly: true,
    genome_apply: true,
    slack_approvals: true,
    ledger_export: true
  }
};

async function getCurrentTenant() {
  const tenantId = await getCurrentTenantId();
  const tenants = await Tenant.filter({ id: tenantId });
  if (tenants.length === 0) {
    throw new Error('Tenant not found');
  }
  return tenants[0];
}

/**
 * Check if action is allowed under current plan
 */
export async function checkPlanLimit(action, currentCount = null) {
  try {
    const tenant = await getCurrentTenant();
    const plan = tenant.plan || 'starter';
    const limits = PLAN_LIMITS[plan];
    
    if (!limits) {
      return { allowed: true, reason: null };
    }
    
    switch (action) {
      case 'create_workflow':
        if (limits.max_workflows === -1) return { allowed: true };
        if (currentCount >= limits.max_workflows) {
          return {
            allowed: false,
            reason: `${plan} plan limited to ${limits.max_workflows} workflows. Upgrade to add more.`,
            upgrade_required: plan === 'starter' ? 'growth' : 'scale'
          };
        }
        return { allowed: true };
        
      case 'create_connection':
        if (limits.max_connections === -1) return { allowed: true };
        if (currentCount >= limits.max_connections) {
          return {
            allowed: false,
            reason: `${plan} plan limited to ${limits.max_connections} connections. Upgrade to add more.`,
            upgrade_required: plan === 'starter' ? 'growth' : 'scale'
          };
        }
        return { allowed: true };
        
      case 'genome_apply':
        if (!limits.genome_apply) {
          return {
            allowed: false,
            reason: 'Applying Genome suggestions requires Growth plan or higher.',
            upgrade_required: 'growth'
          };
        }
        return { allowed: true };
        
      case 'ledger_export':
        if (!limits.ledger_export) {
          return {
            allowed: false,
            reason: 'Compliance ledger export requires Scale plan.',
            upgrade_required: 'scale'
          };
        }
        return { allowed: true };
        
      case 'slack_approvals':
        if (!limits.slack_approvals) {
          return {
            allowed: false,
            reason: 'Slack approvals require Growth plan or higher.',
            upgrade_required: 'growth'
          };
        }
        return { allowed: true };
        
      case 'api_action':
        const actionsThisMonth = tenant.actions_this_month || 0;
        if (limits.max_actions_per_month === -1) return { allowed: true };
        if (actionsThisMonth >= limits.max_actions_per_month) {
          return {
            allowed: false,
            reason: `Monthly action limit reached (${limits.max_actions_per_month}). Resets on ${tenant.month_reset_date || 'next month'}.`,
            upgrade_required: plan === 'starter' ? 'growth' : 'scale'
          };
        }
        return { allowed: true, remaining: limits.max_actions_per_month - actionsThisMonth };
        
      default:
        return { allowed: true };
    }
  } catch (error) {
    console.error('Plan check failed:', error);
    // Fail open to avoid blocking users due to errors
    return { allowed: true, reason: null };
  }
}

/**
 * Increment action counter
 */
export async function incrementActionCount(count = 1) {
  try {
    const tenant = await getCurrentTenant();
    const newCount = (tenant.actions_this_month || 0) + count;
    await Tenant.update(tenant.id, { actions_this_month: newCount });
    return newCount;
  } catch (error) {
    console.error('Failed to increment action count:', error);
  }
}

/**
 * Get plan display info
 */
export function getPlanInfo(planName) {
  return {
    starter: {
      name: 'Starter',
      price: '€99/mo',
      features: ['2 workflows', '2 integrations', '1,000 actions/month', 'Email support']
    },
    growth: {
      name: 'Growth',
      price: '€299/mo',
      features: ['5 workflows', '5 integrations', '10,000 actions/month', 'Slack approvals', 'Genome AI']
    },
    scale: {
      name: 'Scale',
      price: 'Custom',
      features: ['Unlimited workflows', 'Unlimited integrations', 'Unlimited actions', 'Compliance exports', 'SSO/SAML']
    }
  }[planName];
}

export default { checkPlanLimit, incrementActionCount, getPlanInfo };