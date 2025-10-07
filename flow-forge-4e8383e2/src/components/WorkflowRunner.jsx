
import React from 'react';
import { Workflow, WorkflowStep, Run, RunLog, Approval, Credential, Connection } from '@/api/entities';
import { safeExec } from './SafeExec';
import { v4 as uuidv4 } from 'uuid';

/**
 * WorkflowRunner: Orchestrates workflow execution
 * Handles: step sequencing, approvals, context passing, rollback
 */
export const runWorkflow = async ({
  tenantId,
  workflowId,
  triggerPayload,
  idempotencyKey,
  userId
}) => {
  const correlationId = uuidv4();
  
  try {
    // Check idempotency
    const existing = await Run.filter({
      tenant_id: tenantId,
      idempotency_key: idempotencyKey
    });
    
    if (existing.length > 0) {
      return { runId: existing[0].id, status: 'duplicate', message: 'Already processed' };
    }

    // Load workflow
    const workflow = await Workflow.get(workflowId);
    if (!workflow || workflow.tenant_id !== tenantId) {
      throw new Error('Workflow not found or unauthorized');
    }

    // Create run record
    const run = await Run.create({
      tenant_id: tenantId,
      workflow_id: workflowId,
      idempotency_key: idempotencyKey,
      trigger_type: 'manual',
      trigger_payload: triggerPayload,
      status: 'pending',
      current_step_order: 0,
      started_at: new Date().toISOString(),
      correlation_id: correlationId,
      is_simulation: workflow.simulation_mode,
      context: { trigger: triggerPayload },
      actions_count: 0
    });

    await logRun(run.id, tenantId, 'INFO', `Workflow started: ${workflow.display_name}`, { correlationId });

    return { runId: run.id, status: 'pending', correlationId };
    
  } catch (error) {
    console.error('Failed to enqueue workflow:', error);
    throw error;
  }
};

/**
 * Process next step of a run
 */
export const processNextStep = async (runId, tenantId) => {
  try {
    // Load run
    const run = await Run.get(runId);
    if (!run || run.tenant_id !== tenantId) {
      throw new Error('Run not found or unauthorized');
    }

    if (run.status !== 'pending') {
      return { status: run.status, message: 'Run not in pending state' };
    }

    // Mark in progress
    await Run.update(runId, { status: 'in_progress' });

    // Load workflow steps
    const steps = await WorkflowStep.filter(
      { workflow_id: run.workflow_id },
      'step_order'
    );

    const currentStep = steps.find(s => s.step_order === run.current_step_order);
    if (!currentStep) {
      // No more steps - complete
      await Run.update(runId, {
        status: 'completed',
        finished_at: new Date().toISOString(),
        duration_ms: new Date() - new Date(run.started_at)
      });
      await logRun(runId, tenantId, 'INFO', 'Workflow completed successfully');
      return { status: 'completed' };
    }

    // Check if step requires approval
    if (currentStep.requires_approval) {
      const approval = await Approval.create({
        tenant_id: tenantId,
        run_id: runId,
        step_id: currentStep.id,
        state: 'pending',
        requested_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        context: {
          step_name: currentStep.step_name,
          action: `${currentStep.tool}.${currentStep.action}`,
          mapping: currentStep.mapping_json
        }
      });

      await Run.update(runId, { status: 'awaiting_approval' });
      await logRun(runId, tenantId, 'INFO', `Awaiting approval for step: ${currentStep.step_name}`);
      
      return { status: 'awaiting_approval', approvalId: approval.id };
    }

    // Execute step
    const stepResult = await executeStep(run, currentStep, tenantId);

    // Update run context
    const updatedContext = {
      ...run.context,
      [currentStep.step_name]: stepResult.result
    };

    // Move to next step
    const isLastStep = run.current_step_order >= steps.length - 1;
    
    await Run.update(runId, {
      status: isLastStep ? 'completed' : 'pending',
      current_step_order: run.current_step_order + 1,
      context: updatedContext,
      actions_count: run.actions_count + 1,
      finished_at: isLastStep ? new Date().toISOString() : undefined,
      duration_ms: isLastStep ? (new Date() - new Date(run.started_at)) : undefined
    });

    await logRun(runId, tenantId, 'INFO', `Step completed: ${currentStep.step_name}`, {
      duration: stepResult.duration,
      result: stepResult.result
    });

    return {
      status: isLastStep ? 'completed' : 'pending',
      nextStep: run.current_step_order + 1,
      stepResult: stepResult.result
    };

  } catch (error) {
    await Run.update(runId, {
      status: 'failed',
      error_message: error.message,
      finished_at: new Date().toISOString()
    });
    await logRun(runId, tenantId, 'ERROR', `Step failed: ${error.message}`, { error: error.stack });
    throw error;
  }
};

/**
 * Execute a single workflow step
 */
async function executeStep(run, step, tenantId) {
  // Load connection and credential
  const connection = await Connection.get(step.connection_id);
  if (!connection || connection.tenant_id !== tenantId) {
    throw new Error('Connection not found or unauthorized');
  }

  const credentials = await Credential.filter({ connection_id: connection.id });
  if (credentials.length === 0) {
    throw new Error('No credentials found for connection');
  }

  const credential = JSON.parse(decryptCredential(credentials[0].encrypted_value));

  // Resolve mapping using context
  const params = resolveMapping(step.mapping_json, run.context);

  // Check simulation mode
  if (run.is_simulation) {
    await logRun(run.id, tenantId, 'INFO', `[SIMULATION] Would execute: ${step.tool}.${step.action}`, { params });
    return {
      success: true,
      result: { simulated: true, action: step.action, params },
      duration: 0
    };
  }

  // Execute via safeExec
  return await safeExec({
    provider: step.tool,
    action: step.action,
    params,
    connection,
    credential,
    correlationId: run.correlation_id,
    retries: step.retry_on_failure ? 3 : 1
  });
}

/**
 * Resolve mapping JSON using context (simple JSONPath-like)
 */
function resolveMapping(mapping, context) {
  const resolved = {};
  
  for (const [key, value] of Object.entries(mapping)) {
    if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
      const path = value.slice(2, -2).trim();
      resolved[key] = resolvePath(path, context);
    } else if (typeof value === 'object') {
      resolved[key] = resolveMapping(value, context);
    } else {
      resolved[key] = value;
    }
  }
  
  return resolved;
}

function resolvePath(path, context) {
  const parts = path.split('.');
  let current = context;
  
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }
  
  return current;
}

/**
 * Decrypt credential (placeholder - implement AES-GCM)
 */
function decryptCredential(encryptedValue) {
  // TODO: Implement proper AES-256-GCM decryption
  // For now, assume it's base64 encoded
  try {
    return atob(encryptedValue);
  } catch {
    return encryptedValue;
  }
}

/**
 * Log to RunLog
 */
async function logRun(runId, tenantId, level, message, payload = {}) {
  await RunLog.create({
    tenant_id: tenantId,
    run_id: runId,
    log_level: level,
    message,
    payload_json: payload,
    timestamp: new Date().toISOString()
  });
}

export default { runWorkflow, processNextStep };
