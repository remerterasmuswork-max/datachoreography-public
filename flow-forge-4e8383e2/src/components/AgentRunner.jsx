/**
 * AgentRunner: Execution engine for agent skills
 * Provides sandboxed execution environment with rate limiting and monitoring
 */

import { AgentSkill, AgentSkillVersion, AgentInstall, AgentExecutionLog } from '@/api/entities';
import TenantEntity, { getCurrentTenantId } from './TenantEntity';
import { withTimeout } from './RuntimeSafety';

// ============================================================================
// AGENT RUNNER
// ============================================================================

export class AgentRunner {
  constructor(tenantId) {
    this.tenantId = tenantId;
    this.executionCache = new Map();
  }

  /**
   * Execute a skill
   * @param {string} skillId - Skill identifier
   * @param {object} input - Input data for skill
   * @param {object} context - Execution context (workflow_run_id, etc.)
   * @returns {Promise<object>} - Execution result
   */
  async execute(skillId, input, context = {}) {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const startTime = Date.now();

    try {
      // 1. Load skill installation
      const TenantAgentInstall = TenantEntity.wrap(AgentInstall);
      const installations = await TenantAgentInstall.filter({ skill_id: skillId });
      
      if (installations.length === 0) {
        throw new Error(`Skill ${skillId} not installed for this tenant`);
      }

      const install = installations[0];
      
      if (!install.enabled) {
        throw new Error(`Skill ${skillId} is disabled`);
      }

      // 2. Load skill version and manifest
      const versions = await AgentSkillVersion.filter({ 
        skill_id: skillId, 
        version: install.installed_version 
      });

      if (versions.length === 0) {
        throw new Error(`Skill version ${install.installed_version} not found`);
      }

      const version = versions[0];
      const manifest = version.manifest_json;

      // 3. Validate input against manifest schema
      this.validateInput(input, manifest.input_schema);

      // 4. Check permissions and rate limits
      await this.checkPermissions(install, manifest);
      await this.checkRateLimits(skillId);

      // 5. Create execution log
      const TenantExecutionLog = TenantEntity.wrap(AgentExecutionLog);
      const log = await TenantExecutionLog.create({
        skill_id: skillId,
        execution_id: executionId,
        triggered_by: context.triggered_by || 'manual',
        workflow_run_id: context.workflow_run_id,
        input_data: input,
        status: 'running',
        started_at: new Date().toISOString()
      });

      // 6. Create sandbox and execute
      const sandbox = new SkillSandbox(this.tenantId, install, manifest);
      
      const result = await withTimeout(
        sandbox.execute(input, context),
        manifest.timeout_ms || 30000,
        `Skill ${skillId} execution timed out`
      );

      // 7. Update execution log with success
      const duration = Date.now() - startTime;
      await TenantExecutionLog.update(log.id, {
        status: 'success',
        output_data: result,
        finished_at: new Date().toISOString(),
        duration_ms: duration,
        api_calls_made: sandbox.apiCallCount
      });

      // 8. Update install statistics
      await TenantAgentInstall.update(install.id, {
        last_execution: new Date().toISOString(),
        execution_count: (install.execution_count || 0) + 1
      });

      return {
        success: true,
        execution_id: executionId,
        output: result,
        duration_ms: duration
      };

    } catch (error) {
      // Log execution failure
      const duration = Date.now() - startTime;
      const TenantExecutionLog = TenantEntity.wrap(AgentExecutionLog);
      
      try {
        const logs = await TenantExecutionLog.filter({ execution_id: executionId });
        if (logs.length > 0) {
          await TenantExecutionLog.update(logs[0].id, {
            status: 'error',
            error_message: error.message,
            error_stack: error.stack,
            finished_at: new Date().toISOString(),
            duration_ms: duration
          });
        }
      } catch (logError) {
        console.error('Failed to update execution log:', logError);
      }

      throw error;
    }
  }

  /**
   * Validate input against JSON schema
   */
  validateInput(input, schema) {
    if (!schema) return;

    // Basic validation - in production, use a proper JSON schema validator
    const required = schema.required || [];
    for (const field of required) {
      if (!(field in input)) {
        throw new Error(`Missing required input field: ${field}`);
      }
    }
  }

  /**
   * Check if skill has required permissions
   */
  async checkPermissions(install, manifest) {
    const requiredScopes = manifest.required_scopes || [];
    const grantedScopes = install.permissions_granted || [];

    for (const scope of requiredScopes) {
      if (!grantedScopes.includes(scope)) {
        throw new Error(`Permission denied: skill requires scope '${scope}'`);
      }
    }
  }

  /**
   * Check rate limits for skill execution
   */
  async checkRateLimits(skillId) {
    // Simple in-memory rate limiting - in production, use Redis
    const key = `${this.tenantId}:${skillId}`;
    const now = Date.now();
    const window = 60 * 1000; // 1 minute window
    const limit = 100; // 100 executions per minute

    if (!this.executionCache.has(key)) {
      this.executionCache.set(key, []);
    }

    const executions = this.executionCache.get(key);
    const recentExecutions = executions.filter(t => now - t < window);

    if (recentExecutions.length >= limit) {
      throw new Error('Rate limit exceeded for skill execution');
    }

    recentExecutions.push(now);
    this.executionCache.set(key, recentExecutions);
  }
}

// ============================================================================
// SKILL SANDBOX
// ============================================================================

export class SkillSandbox {
  constructor(tenantId, install, manifest) {
    this.tenantId = tenantId;
    this.install = install;
    this.manifest = manifest;
    this.apiCallCount = 0;
    this.logs = [];
  }

  /**
   * Execute skill code in sandbox
   * @param {object} input - Input data
   * @param {object} context - Execution context
   * @returns {Promise<object>} - Execution result
   */
  async execute(input, context) {
    // Create sandboxed API surface
    const api = this.createSandboxAPI();

    // Execute skill code
    // In production, this would load and execute the actual skill code
    // For now, we'll simulate execution based on skill_id
    const skillId = this.install.skill_id;

    if (skillId === 'ar_chaser_lite') {
      return await this.executeARChaserLite(input, api);
    }

    // Default: call the execute function from manifest
    if (this.manifest.execute) {
      return await this.manifest.execute(input, api, context);
    }

    throw new Error(`No execution handler for skill ${skillId}`);
  }

  /**
   * Create sandboxed API for skills to use
   */
  createSandboxAPI() {
    return {
      // Logging
      log: (level, message, data) => {
        this.logs.push({
          level,
          message,
          data,
          timestamp: new Date().toISOString()
        });
      },

      // Fetch with rate limiting and monitoring
      fetch: async (url, options = {}) => {
        this.apiCallCount++;
        
        // Add authorization if connection is mapped
        const connection = await this.getConnection(url);
        if (connection) {
          options.headers = {
            ...options.headers,
            'Authorization': `Bearer ${connection.token}` // Simplified
          };
        }

        return await fetch(url, options);
      },

      // Entity access (scoped to tenant)
      entities: this.createEntityAPI(),

      // Config access
      getConfig: (key) => {
        return this.install.config?.[key];
      },

      // Time utilities
      now: () => new Date().toISOString(),
      
      // Crypto utilities (for hashing, not sensitive ops)
      hash: async (data) => {
        const encoder = new TextEncoder();
        const buffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
        return Array.from(new Uint8Array(buffer))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
      }
    };
  }

  /**
   * Create entity API for skills
   */
  createEntityAPI() {
    const allowedEntities = this.manifest.allowed_entities || [];
    const api = {};

    for (const entityName of allowedEntities) {
      api[entityName] = {
        list: async (sort, limit) => {
          // Check read permission
          if (!this.install.permissions_granted.includes(`read_${entityName.toLowerCase()}`)) {
            throw new Error(`Permission denied: read_${entityName.toLowerCase()}`);
          }
          
          const Entity = await import(`@/api/entities/${entityName}`);
          const TenantEntity = TenantEntity.wrap(Entity.default || Entity);
          return await TenantEntity.list(sort, limit);
        },

        create: async (data) => {
          // Check write permission
          if (!this.install.permissions_granted.includes(`write_${entityName.toLowerCase()}`)) {
            throw new Error(`Permission denied: write_${entityName.toLowerCase()}`);
          }
          
          const Entity = await import(`@/api/entities/${entityName}`);
          const TenantEntity = TenantEntity.wrap(Entity.default || Entity);
          return await TenantEntity.create(data);
        }
      };
    }

    return api;
  }

  /**
   * Get connection credentials (simplified)
   */
  async getConnection(url) {
    // Determine which connection is needed based on URL
    // In production, this would decrypt credentials from Connection entity
    return null; // Placeholder
  }

  /**
   * Example: AR Chaser Lite execution
   */
  async executeARChaserLite(input, api) {
    api.log('INFO', 'Starting AR Chaser Lite execution');

    // 1. Find overdue invoices
    const invoices = await api.entities.Invoice.list('-due_date', 100);
    const overdue = invoices.filter(inv => {
      return inv.status !== 'paid' && new Date(inv.due_date) < new Date();
    });

    api.log('INFO', `Found ${overdue.length} overdue invoices`);

    // 2. Segment by days overdue
    const segments = {
      '0-30': [],
      '31-60': [],
      '61-90': [],
      '90+': []
    };

    const now = Date.now();
    for (const inv of overdue) {
      const daysOverdue = Math.floor((now - new Date(inv.due_date).getTime()) / (24 * 60 * 60 * 1000));
      
      if (daysOverdue <= 30) segments['0-30'].push(inv);
      else if (daysOverdue <= 60) segments['31-60'].push(inv);
      else if (daysOverdue <= 90) segments['61-90'].push(inv);
      else segments['90+'].push(inv);
    }

    // 3. Generate reminder tasks
    const tasks = [];
    for (const [segment, invoices] of Object.entries(segments)) {
      for (const inv of invoices) {
        tasks.push({
          invoice_id: inv.id,
          customer_email: inv.customer_email,
          amount_due: inv.amount_due,
          days_overdue: segment,
          action: this.getActionForSegment(segment),
          priority: segment === '90+' ? 'high' : 'medium'
        });
      }
    }

    api.log('INFO', `Generated ${tasks.length} reminder tasks`);

    return {
      overdue_count: overdue.length,
      total_overdue_amount: overdue.reduce((sum, inv) => sum + inv.amount_due, 0),
      segments: Object.fromEntries(
        Object.entries(segments).map(([k, v]) => [k, v.length])
      ),
      tasks
    };
  }

  getActionForSegment(segment) {
    switch (segment) {
      case '0-30': return 'send_gentle_reminder';
      case '31-60': return 'send_firm_reminder';
      case '61-90': return 'escalate_to_manager';
      case '90+': return 'consider_collections';
      default: return 'review';
    }
  }
}

// ============================================================================
// SKILL SIGNATURE VERIFICATION
// ============================================================================

/**
 * Verify skill code signature
 * @param {string} codeBundle - Skill code bundle
 * @param {string} signature - HMAC signature
 * @param {string} skillId - Skill ID
 * @returns {Promise<boolean>} - Whether signature is valid
 */
export async function verifySkillSignature(codeBundle, signature, skillId) {
  try {
    // Get signing key (in production, from secure storage)
    const SIGNING_KEY = 'datachor_skill_signing_key_v1'; // Placeholder
    
    // Compute HMAC
    const encoder = new TextEncoder();
    const keyData = encoder.encode(SIGNING_KEY);
    const messageData = encoder.encode(skillId + ':' + codeBundle);
    
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify']
    );
    
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, messageData);
    const computedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    return computedSignature === signature;
    
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
}

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/*
// Example: Execute AR Chaser Lite skill

import { AgentRunner } from '@/components/AgentRunner';
import { getCurrentTenantId } from '@/components/TenantEntity';

const tenantId = await getCurrentTenantId();
const runner = new AgentRunner(tenantId);

const result = await runner.execute('ar_chaser_lite', {
  // Input parameters
  include_segments: ['0-30', '31-60', '61-90', '90+'],
  max_invoices: 100
}, {
  triggered_by: 'schedule',
  workflow_run_id: 'run_123'
});

console.log('AR Chaser result:', result);
// Output: { success: true, output: { overdue_count: 15, tasks: [...] } }
*/

export default AgentRunner;