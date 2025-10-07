import React from 'react';
import { runWorkflow, processNextStep } from './WorkflowRunner';
import { Approval } from '@/api/entities';

/**
 * API Handler: Exposes workflow actions as callable functions
 * Can be triggered by UI or external systems
 */

// In production, these tokens should be stored in a secure backend config
// For now, using a demo token - replace with proper auth system
const VALID_TOKENS = [
  'demo_token_for_testing' // Replace with proper token management
];

function validateAuth(token) {
  // In production, validate against backend token store
  if (!token || !VALID_TOKENS.includes(token)) {
    throw new Error('Unauthorized: Invalid token');
  }
}

export async function apiEnqueue(request) {
  try {
    validateAuth(request.auth_token);
    
    const { tenant_id, workflow_key, trigger_payload, idempotency_key } = request;
    
    if (!tenant_id || !workflow_key || !trigger_payload) {
      return {
        error: 'Missing required fields: tenant_id, workflow_key, trigger_payload'
      };
    }
    
    const result = await runWorkflow({
      tenantId: tenant_id,
      workflowId: workflow_key,
      triggerPayload: trigger_payload,
      idempotencyKey: idempotency_key || `api_${Date.now()}`,
      userId: 'api_user'
    });
    
    return result;
  } catch (error) {
    return { error: error.message };
  }
}

export async function apiProcessNext(request) {
  try {
    validateAuth(request.auth_token);
    
    const { tenant_id, run_id } = request;
    
    if (!tenant_id) {
      return { error: 'Missing required field: tenant_id' };
    }
    
    // If run_id provided, process that specific run
    // Otherwise, find next pending run for tenant
    let targetRunId = run_id;
    
    if (!targetRunId) {
      const { Run } = await import('@/api/entities');
      const pendingRuns = await Run.filter(
        { tenant_id, status: 'pending' },
        'started_at',
        1
      );
      
      if (pendingRuns.length === 0) {
        return { status: 'no_pending_runs' };
      }
      
      targetRunId = pendingRuns[0].id;
    }
    
    const result = await processNextStep(targetRunId, tenant_id);
    return result;
  } catch (error) {
    return { error: error.message };
  }
}

export async function apiApprove(request) {
  try {
    validateAuth(request.auth_token);
    
    const { approval_id, approver_id, state, comment } = request;
    
    if (!approval_id || !state || !['approved', 'rejected'].includes(state)) {
      return { error: 'Missing or invalid fields' };
    }
    
    // Update approval
    await Approval.update(approval_id, {
      state,
      approver_id,
      responded_at: new Date().toISOString(),
      comment
    });
    
    // If approved, resume the run
    if (state === 'approved') {
      const approval = await Approval.get(approval_id);
      const { Run } = await import('@/api/entities');
      await Run.update(approval.run_id, { status: 'pending' });
      
      // Optionally trigger immediate processing
      const result = await processNextStep(approval.run_id, approval.tenant_id);
      return { approval_id, new_state: state, run_resumed: true, result };
    }
    
    return { approval_id, new_state: state };
  } catch (error) {
    return { error: error.message };
  }
}

export default { apiEnqueue, apiProcessNext, apiApprove };