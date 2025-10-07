/**
 * GuardrailChecker: Enforce risk thresholds and compliance rules
 * Checks if workflow steps should be blocked or require approval
 */

import { RiskConfig, ComplianceRule } from '@/api/entities';
import TenantEntity from './TenantEntity';

// ============================================================================
// MAIN GUARDRAIL CHECKER
// ============================================================================

/**
 * Check all guardrails for a workflow step
 * @param {object} run - Run object
 * @param {object} step - WorkflowStep object
 * @param {object} context - Workflow context with data
 * @returns {Promise<{blocked, requires_approval, guardrails}>}
 */
export async function checkGuardrails(run, step, context) {
  const guardrails = [];
  
  // 1. Load risk config for tenant
  const riskConfig = await loadRiskConfig(run.tenant_id);
  
  // 2. Check kill switch
  if (riskConfig.kill_switch) {
    guardrails.push({
      type: 'kill_switch',
      reason: 'Emergency kill switch is active - all workflows blocked',
      severity: 'critical',
      blocked: true
    });
  }
  
  // 3. Check daily action limit
  const actionLimitCheck = await checkDailyActionLimit(run.tenant_id, riskConfig);
  if (actionLimitCheck.blocked) {
    guardrails.push(actionLimitCheck);
  }
  
  // 4. Value threshold check (e.g., high-value transactions)
  const valueCheck = await checkValueThreshold(step, context, riskConfig);
  if (valueCheck) {
    guardrails.push(valueCheck);
  }
  
  // 5. Risk score check
  const riskScoreCheck = checkRiskScore(run, riskConfig);
  if (riskScoreCheck) {
    guardrails.push(riskScoreCheck);
  }
  
  // 6. Step risk level check
  const stepRiskCheck = checkStepRiskLevel(step, riskConfig);
  if (stepRiskCheck) {
    guardrails.push(stepRiskCheck);
  }
  
  // 7. Provider scope check
  const scopeCheck = checkProviderScopes(step, riskConfig);
  if (scopeCheck) {
    guardrails.push(scopeCheck);
  }
  
  // 8. Compliance rule checks
  const complianceChecks = await checkComplianceRules(run.tenant_id, context, step);
  guardrails.push(...complianceChecks);
  
  // 9. Determine final verdict
  const blocked = guardrails.some(g => g.blocked === true || g.severity === 'critical');
  const requires_approval = guardrails.some(g => g.type === 'approval_required' || g.severity === 'high');
  
  return {
    blocked,
    requires_approval,
    guardrails,
    summary: generateGuardrailSummary(guardrails)
  };
}

// ============================================================================
// INDIVIDUAL GUARDRAIL CHECKS
// ============================================================================

/**
 * Load risk configuration for tenant
 */
async function loadRiskConfig(tenantId) {
  const TenantConfig = TenantEntity.wrap(RiskConfig);
  const configs = await TenantConfig.filter({ tenant_id: tenantId });
  
  if (configs.length === 0) {
    // Return default config
    return {
      tenant_id: tenantId,
      max_refund_amount: 10000,
      require_approval_above: 1000,
      kill_switch: false,
      dry_run: false,
      max_daily_actions: 500,
      block_high_risk_steps: false,
      allowed_provider_scopes: {}
    };
  }
  
  return configs[0];
}

/**
 * Check daily action limit
 */
async function checkDailyActionLimit(tenantId, riskConfig) {
  // Count actions today
  const today = new Date().toISOString().split('T')[0];
  
  // This would query Run entity for today's actions
  // For now, simplified check
  const actionsToday = 0; // TODO: Implement actual counting
  
  if (actionsToday >= riskConfig.max_daily_actions) {
    return {
      type: 'rate_limit',
      reason: `Daily action limit exceeded: ${actionsToday}/${riskConfig.max_daily_actions}`,
      severity: 'high',
      blocked: true,
      metadata: {
        actions_today: actionsToday,
        limit: riskConfig.max_daily_actions
      }
    };
  }
  
  return null;
}

/**
 * Check if transaction value exceeds threshold
 */
async function checkValueThreshold(step, context, riskConfig) {
  if (!step.amount_path) {
    return null; // No amount to check
  }
  
  const amount = extractAmount(context, step.amount_path);
  
  if (amount === null) {
    return null;
  }
  
  // Check against approval threshold
  if (amount > riskConfig.require_approval_above) {
    return {
      type: 'approval_required',
      reason: `Amount €${amount.toFixed(2)} exceeds approval threshold €${riskConfig.require_approval_above}`,
      severity: amount > riskConfig.max_refund_amount ? 'critical' : 'high',
      blocked: false,
      metadata: {
        amount,
        threshold: riskConfig.require_approval_above,
        max_amount: riskConfig.max_refund_amount
      }
    };
  }
  
  return null;
}

/**
 * Extract amount from context using JSONPath
 */
function extractAmount(context, path) {
  if (!path) return null;
  
  try {
    // Simple JSONPath extraction (e.g., "$.order.total_amount")
    const keys = path.replace('$.', '').split('.');
    let value = context;
    
    for (const key of keys) {
      value = value?.[key];
      if (value === undefined) return null;
    }
    
    return typeof value === 'number' ? value : null;
  } catch (error) {
    return null;
  }
}

/**
 * Check run risk score
 */
function checkRiskScore(run, riskConfig) {
  if (!run.risk_score) {
    return null;
  }
  
  if (run.risk_score >= 80) {
    return {
      type: 'high_risk',
      reason: `Run risk score is ${run.risk_score}/100 (critical threshold)`,
      severity: 'critical',
      blocked: true,
      metadata: {
        risk_score: run.risk_score
      }
    };
  }
  
  if (run.risk_score >= 60) {
    return {
      type: 'medium_risk',
      reason: `Run risk score is ${run.risk_score}/100 (requires approval)`,
      severity: 'high',
      blocked: false,
      metadata: {
        risk_score: run.risk_score
      }
    };
  }
  
  return null;
}

/**
 * Check step risk level
 */
function checkStepRiskLevel(step, riskConfig) {
  if (!step.risk_level) {
    return null;
  }
  
  if (step.risk_level === 'critical' && riskConfig.block_high_risk_steps) {
    return {
      type: 'step_risk_blocked',
      reason: `Step "${step.step_name}" is marked as CRITICAL risk and blocking is enabled`,
      severity: 'critical',
      blocked: true,
      metadata: {
        step_name: step.step_name,
        risk_level: step.risk_level
      }
    };
  }
  
  if (step.risk_level === 'high' || step.risk_level === 'critical') {
    return {
      type: 'high_risk_step',
      reason: `Step "${step.step_name}" is marked as ${step.risk_level.toUpperCase()} risk`,
      severity: 'high',
      blocked: false,
      metadata: {
        step_name: step.step_name,
        risk_level: step.risk_level
      }
    };
  }
  
  return null;
}

/**
 * Check if step's provider scopes are allowed
 */
function checkProviderScopes(step, riskConfig) {
  if (!step.tool || !riskConfig.allowed_provider_scopes) {
    return null;
  }
  
  const allowedScopes = riskConfig.allowed_provider_scopes[step.tool];
  if (!allowedScopes || allowedScopes.length === 0) {
    return null; // No restrictions for this provider
  }
  
  // Check if action is allowed (simplified - would need more complex matching)
  const actionScope = step.action; // e.g., "orders.get", "refunds.create"
  const allowed = allowedScopes.some(scope => actionScope.startsWith(scope));
  
  if (!allowed) {
    return {
      type: 'scope_violation',
      reason: `Action "${step.action}" is not in allowed scopes for provider "${step.tool}"`,
      severity: 'critical',
      blocked: true,
      metadata: {
        provider: step.tool,
        action: step.action,
        allowed_scopes: allowedScopes
      }
    };
  }
  
  return null;
}

/**
 * Check compliance rules
 */
async function checkComplianceRules(tenantId, context, step) {
  const TenantRule = TenantEntity.wrap(ComplianceRule);
  const rules = await TenantRule.filter({ enabled: true });
  
  const violations = [];
  
  for (const rule of rules) {
    const violated = evaluateComplianceRule(rule, context, step);
    
    if (violated) {
      violations.push({
        type: 'compliance_violation',
        reason: `Compliance rule violated: ${rule.rule_name}`,
        severity: mapViolationSeverity(rule.violation_severity),
        blocked: rule.violation_severity === 'critical' || rule.violation_severity === 'error',
        metadata: {
          rule_key: rule.rule_key,
          rule_name: rule.rule_name,
          jurisdiction: rule.jurisdiction,
          category: rule.category,
          auto_remediation: rule.auto_remediation
        }
      });
    }
  }
  
  return violations;
}

/**
 * Evaluate compliance rule logic
 */
function evaluateComplianceRule(rule, context, step) {
  if (!rule.rule_logic) {
    return false;
  }
  
  try {
    // Simplified JSONLogic evaluation
    // In production, use jsonlogic library
    const logic = rule.rule_logic;
    
    // Example rule: { "and": [ {">=": [{"var": "amount"}, 10000]}, {"==": [{"var": "country"}, "US"]} ] }
    return evaluateLogic(logic, { ...context, step });
    
  } catch (error) {
    console.error('Failed to evaluate compliance rule:', error);
    return false;
  }
}

/**
 * Simple JSONLogic evaluator (use jsonlogic library in production)
 */
function evaluateLogic(logic, data) {
  if (logic.and) {
    return logic.and.every(condition => evaluateLogic(condition, data));
  }
  
  if (logic.or) {
    return logic.or.some(condition => evaluateLogic(condition, data));
  }
  
  if (logic['>=']) {
    const [left, right] = logic['>='];
    return getValue(left, data) >= getValue(right, data);
  }
  
  if (logic['==']) {
    const [left, right] = logic['=='];
    return getValue(left, data) === getValue(right, data);
  }
  
  if (logic['>']) {
    const [left, right] = logic['>'];
    return getValue(left, data) > getValue(right, data);
  }
  
  return false;
}

/**
 * Get value from data using variable reference
 */
function getValue(ref, data) {
  if (typeof ref === 'object' && ref.var) {
    const keys = ref.var.split('.');
    let value = data;
    for (const key of keys) {
      value = value?.[key];
      if (value === undefined) return null;
    }
    return value;
  }
  return ref;
}

/**
 * Map violation severity to guardrail severity
 */
function mapViolationSeverity(severity) {
  const mapping = {
    'advisory': 'low',
    'warning': 'medium',
    'error': 'high',
    'critical': 'critical'
  };
  return mapping[severity] || 'medium';
}

/**
 * Generate human-readable summary of guardrails
 */
function generateGuardrailSummary(guardrails) {
  if (guardrails.length === 0) {
    return 'All guardrails passed';
  }
  
  const blocked = guardrails.filter(g => g.blocked);
  const approvals = guardrails.filter(g => g.type === 'approval_required');
  const warnings = guardrails.filter(g => !g.blocked && g.type !== 'approval_required');
  
  const parts = [];
  if (blocked.length > 0) {
    parts.push(`${blocked.length} blocking issue(s)`);
  }
  if (approvals.length > 0) {
    parts.push(`${approvals.length} approval(s) required`);
  }
  if (warnings.length > 0) {
    parts.push(`${warnings.length} warning(s)`);
  }
  
  return parts.join(', ');
}

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/*
import { checkGuardrails } from './GuardrailChecker';

const result = await checkGuardrails(run, step, context);

if (result.blocked) {
  console.error('Step blocked by guardrails:', result.guardrails);
  throw new Error('Guardrails blocked execution');
}

if (result.requires_approval) {
  console.log('Approval required:', result.summary);
  // Create Approval entity and pause run
  await createApproval(run, step, result.guardrails);
}

// Otherwise, proceed with step execution
*/

export default { checkGuardrails };