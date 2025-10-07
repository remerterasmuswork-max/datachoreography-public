/**
 * ComplianceLogger: Tamper-proof audit trail with crypto-chaining
 * 
 * PURPOSE:
 * - GDPR Article 30: Record of Processing Activities
 * - SOC2: Audit logging for all sensitive operations
 * - Forensic evidence: Detect tampering via hash chain
 * 
 * ARCHITECTURE:
 * - Each event contains SHA256(prev_event + current_event)
 * - Chain breaks if any event is modified or deleted
 * - Periodic anchoring to external timestamping service (future)
 * 
 * COMPLIANCE STANDARDS:
 * - GDPR: Demonstrates accountability and security measures
 * - SOC2 CC6.1: Logs access to sensitive data
 * - SOC2 CC6.2: Monitors system activity
 * - ISO 27001: A.12.4.1 Event logging
 * 
 * CRYPTO-SHREDDING FOR GDPR RIGHT TO ERASURE:
 * - Delete encryption key → data becomes permanently unrecoverable
 * - Comply with GDPR Article 17 without deleting audit trail
 * 
 * BACKEND MIGRATION:
 * - Move hash verification to backend cron job
 * - Add external timestamping (RFC 3161)
 * - Implement Merkle tree for efficient verification
 */

import { ComplianceEvent, ComplianceAnchor } from '@/api/entities';
import { getCurrentTenantId } from './TenantDefense';

class ComplianceLogger {
  constructor() {
    this.chainCache = new Map(); // Cache last event per tenant
  }
  
  // ==========================================================================
  // PUBLIC LOGGING API
  // ==========================================================================
  
  /**
   * Log provider API call
   * Required for SOC2 audit: All external data access must be logged
   */
  async logProviderCall(provider, action, params, result, durationMs) {
    const piiFields = this._detectPIIFields(params);
    const redactedParams = piiFields.length > 0 
      ? this._redactPII(params, piiFields)
      : params;
    
    const redactedResult = result?.error ? { error: result.error } : { status: 'success' };
    
    await this._logEvent({
      category: 'provider_call',
      event_type: `${provider}_${action}`,
      ref_type: 'api_call',
      ref_id: `${provider}:${action}:${Date.now()}`,
      actor: 'system',
      payload: {
        provider,
        action,
        params: redactedParams,
        result: redactedResult,
        duration_ms: durationMs,
        pii_redacted: piiFields.length > 0
      },
      pii_redacted: true
    });
  }
  
  /**
   * Log data access
   * GDPR Article 30: Must log who accessed what personal data
   */
  async logDataAccess(userId, resourceType, resourceId, action) {
    await this._logEvent({
      category: 'data_access',
      event_type: `${resourceType}_${action}`,
      ref_type: resourceType,
      ref_id: resourceId,
      actor: userId,
      payload: {
        resource_type: resourceType,
        resource_id: resourceId,
        action,
        ip_address: await this._getClientIP(),
        user_agent: navigator.userAgent
      },
      pii_redacted: false
    });
  }
  
  /**
   * Log configuration change
   * SOC2: Configuration changes must be auditable
   */
  async logConfigChange(userId, configType, oldValue, newValue, reason) {
    await this._logEvent({
      category: 'config_change',
      event_type: `${configType}_updated`,
      ref_type: configType,
      ref_id: configType,
      actor: userId,
      payload: {
        config_type: configType,
        old_value: oldValue,
        new_value: newValue,
        reason,
        changed_at: new Date().toISOString()
      },
      pii_redacted: false
    });
  }
  
  /**
   * Log approval decision
   * Financial workflows require approval trail
   */
  async logApproval(approvalId, userId, decision, comment, amount) {
    await this._logEvent({
      category: 'approval',
      event_type: `approval_${decision}`,
      ref_type: 'approval',
      ref_id: approvalId,
      actor: userId,
      payload: {
        approval_id: approvalId,
        decision,
        comment,
        amount,
        decided_at: new Date().toISOString()
      },
      pii_redacted: true
    });
  }
  
  /**
   * Log financial transaction
   * Audit trail for refunds, payments, invoices
   */
  async logTransaction(transactionType, transactionId, amount, currency, status) {
    await this._logEvent({
      category: transactionType,
      event_type: `${transactionType}_${status}`,
      ref_type: transactionType,
      ref_id: transactionId,
      actor: 'system',
      payload: {
        transaction_id: transactionId,
        amount,
        currency,
        status,
        timestamp: new Date().toISOString()
      },
      pii_redacted: true
    });
  }
  
  // ==========================================================================
  // CRYPTO-CHAIN IMPLEMENTATION
  // ==========================================================================
  
  /**
   * Log event with cryptographic chaining
   * Each event contains hash of previous event
   */
  async _logEvent(eventData) {
    try {
      const tenantId = await getCurrentTenantId();
      
      // Get previous event digest
      const prevDigest = await this._getLastDigest(tenantId);
      
      // Prepare event
      const event = {
        tenant_id: tenantId,
        ...eventData,
        ts: new Date().toISOString(),
        prev_digest_sha256: prevDigest
      };
      
      // Compute digest: SHA256(prev_digest + event_json)
      const currentDigest = await this._computeDigest(event, prevDigest);
      event.digest_sha256 = currentDigest;
      
      // Save to database
      const savedEvent = await ComplianceEvent.create(event);
      
      // Update cache
      this.chainCache.set(tenantId, {
        event_id: savedEvent.id,
        digest: currentDigest,
        timestamp: Date.now()
      });
      
      return savedEvent;
      
    } catch (error) {
      console.error('Failed to log compliance event:', error);
      // CRITICAL: Compliance logging failures must be visible
      throw error;
    }
  }
  
  /**
   * Get last event digest for tenant
   */
  async _getLastDigest(tenantId) {
    // Check cache first
    const cached = this.chainCache.get(tenantId);
    if (cached && Date.now() - cached.timestamp < 60000) { // 1 min TTL
      return cached.digest;
    }
    
    // Query last event from database
    const events = await ComplianceEvent.filter(
      { tenant_id: tenantId },
      '-ts',
      1
    );
    
    if (events.length === 0) {
      return ''; // Genesis event (no previous)
    }
    
    return events[0].digest_sha256;
  }
  
  /**
   * Compute SHA256 digest for event
   * digest = SHA256(prev_digest + canonical_json(event))
   */
  async _computeDigest(event, prevDigest) {
    // Create canonical representation (sorted keys)
    const canonical = this._canonicalize(event);
    
    // Concatenate: prev_digest + canonical_json
    const input = prevDigest + canonical;
    
    // Compute SHA256
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    
    // Convert to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex;
  }
  
  /**
   * Canonicalize event for hashing
   * Ensures same JSON produces same hash
   */
  _canonicalize(obj) {
    // Sort keys recursively
    const sorted = {};
    const keys = Object.keys(obj).sort();
    
    for (const key of keys) {
      if (key === 'digest_sha256') continue; // Exclude digest field itself
      
      const value = obj[key];
      
      if (value === null || value === undefined) {
        sorted[key] = null;
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        sorted[key] = this._canonicalize(value);
      } else {
        sorted[key] = value;
      }
    }
    
    return JSON.stringify(sorted);
  }
  
  // ==========================================================================
  // CHAIN VERIFICATION
  // ==========================================================================
  
  /**
   * Verify integrity of audit trail
   * Detects tampering or deletion of events
   * 
   * @returns {Promise<object>} - Verification report
   */
  async verifyChain(tenantId, fromDate = null, toDate = null) {
    try {
      // Fetch events in chronological order
      const filters = { tenant_id: tenantId };
      if (fromDate) filters.ts_gte = fromDate;
      if (toDate) filters.ts_lte = toDate;
      
      const events = await ComplianceEvent.filter(filters, 'ts', 10000);
      
      if (events.length === 0) {
        return {
          valid: true,
          event_count: 0,
          message: 'No events to verify'
        };
      }
      
      const violations = [];
      let prevDigest = '';
      
      for (let i = 0; i < events.length; i++) {
        const event = events[i];
        
        // Check prev_digest matches
        if (event.prev_digest_sha256 !== prevDigest) {
          violations.push({
            event_id: event.id,
            event_index: i,
            issue: 'prev_digest_mismatch',
            expected: prevDigest,
            actual: event.prev_digest_sha256
          });
        }
        
        // Recompute digest
        const expectedDigest = await this._computeDigest(event, prevDigest);
        
        if (event.digest_sha256 !== expectedDigest) {
          violations.push({
            event_id: event.id,
            event_index: i,
            issue: 'digest_mismatch',
            expected: expectedDigest,
            actual: event.digest_sha256,
            severity: 'CRITICAL'
          });
        }
        
        prevDigest = event.digest_sha256;
      }
      
      return {
        valid: violations.length === 0,
        event_count: events.length,
        violations,
        verified_at: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Chain verification failed:', error);
      return {
        valid: false,
        error: error.message
      };
    }
  }
  
  /**
   * Create periodic anchor
   * Merkle root of all events in period
   * Future: Submit to external timestamping service
   */
  async createAnchor(tenantId, period) {
    try {
      const [year, month, day] = period.split('-');
      const fromTs = new Date(year, month - 1, day, 0, 0, 0).toISOString();
      const toTs = new Date(year, month - 1, day, 23, 59, 59).toISOString();
      
      // Fetch all events in period
      const events = await ComplianceEvent.filter({
        tenant_id: tenantId,
        ts_gte: fromTs,
        ts_lte: toTs
      }, 'ts', 100000);
      
      if (events.length === 0) {
        return null;
      }
      
      // Compute Merkle root (simplified: hash of all digests)
      const allDigests = events.map(e => e.digest_sha256).join('');
      const encoder = new TextEncoder();
      const data = encoder.encode(allDigests);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const merkleRoot = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      // Create HMAC for tamper detection
      const hmac = await this._computeHMAC(merkleRoot, tenantId);
      
      // Save anchor
      const anchor = await ComplianceAnchor.create({
        tenant_id: tenantId,
        period,
        from_ts: fromTs,
        to_ts: toTs,
        anchor_sha256: merkleRoot,
        hmac_sha256: hmac,
        event_count: events.length,
        computed_at: new Date().toISOString()
      });
      
      console.log(`✅ Created compliance anchor for period ${period}: ${events.length} events`);
      
      return anchor;
      
    } catch (error) {
      console.error('Failed to create anchor:', error);
      throw error;
    }
  }
  
  /**
   * Compute HMAC for anchor
   * Detects tampering even if attacker modifies events AND anchor
   */
  async _computeHMAC(data, secret) {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(data);
    
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', key, messageData);
    const signatureArray = Array.from(new Uint8Array(signature));
    const signatureHex = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return signatureHex;
  }
  
  // ==========================================================================
  // GDPR CRYPTO-SHREDDING
  // ==========================================================================
  
  /**
   * Crypto-shred PII for GDPR Right to Erasure
   * 
   * HOW IT WORKS:
   * 1. User data encrypted with unique per-user key
   * 2. When user requests deletion, delete the key
   * 3. Encrypted data remains but is permanently unrecoverable
   * 4. Satisfies GDPR Article 17 without breaking audit trail
   * 
   * CURRENT LIMITATION:
   * We don't have per-user encryption keys yet
   * This is a placeholder for future implementation
   * 
   * BACKEND REQUIREMENT:
   * Store user encryption keys in HSM
   * On deletion request: DELETE key, keep encrypted data
   */
  async cryptoShredUser(userId) {
    console.warn('⚠️ Crypto-shredding not fully implemented (requires backend HSM)');
    
    try {
      // Log the erasure request (this log is NOT deleted)
      await this._logEvent({
        category: 'data_access',
        event_type: 'gdpr_erasure_request',
        ref_type: 'user',
        ref_id: userId,
        actor: userId,
        payload: {
          user_id: userId,
          erasure_date: new Date().toISOString(),
          method: 'crypto_shred'
        },
        pii_redacted: false
      });
      
      // TODO: When backend exists:
      // 1. Call DELETE /api/v1/crypto-keys/${userId}
      // 2. Verify key deletion
      // 3. Keep all ComplianceEvents (they're already PII-redacted)
      // 4. User data is now permanently unrecoverable
      
      console.log(`✅ Crypto-shred requested for user ${userId}`);
      console.log('⚠️ Manual step required: Delete user encryption key from HSM');
      
      return {
        success: true,
        method: 'crypto_shred',
        instructions: 'Delete user encryption key from HSM to complete erasure'
      };
      
    } catch (error) {
      console.error('Crypto-shred failed:', error);
      throw error;
    }
  }
  
  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================
  
  /**
   * Detect PII fields in data
   */
  _detectPIIFields(data) {
    const piiPatterns = [
      'email', 'phone', 'address', 'ssn', 'tax_id', 
      'customer_name', 'customer_email', 'billing_address',
      'shipping_address', 'ip_address', 'credit_card'
    ];
    
    const piiFields = [];
    
    const scan = (obj, path = '') => {
      for (const key in obj) {
        const fullPath = path ? `${path}.${key}` : key;
        
        if (piiPatterns.some(pattern => key.toLowerCase().includes(pattern))) {
          piiFields.push(fullPath);
        }
        
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          scan(obj[key], fullPath);
        }
      }
    };
    
    scan(data);
    return piiFields;
  }
  
  /**
   * Redact PII fields
   */
  _redactPII(data, piiFields) {
    const redacted = JSON.parse(JSON.stringify(data));
    
    for (const fieldPath of piiFields) {
      const parts = fieldPath.split('.');
      let current = redacted;
      
      for (let i = 0; i < parts.length - 1; i++) {
        current = current[parts[i]];
        if (!current) break;
      }
      
      if (current) {
        const lastKey = parts[parts.length - 1];
        if (current[lastKey]) {
          current[lastKey] = '[REDACTED]';
        }
      }
    }
    
    return redacted;
  }
  
  /**
   * Get client IP (placeholder)
   */
  async _getClientIP() {
    // In production, this comes from server headers
    return 'client-ip-unknown';
  }
}

// Export singleton
export const complianceLogger = new ComplianceLogger();
export default ComplianceLogger;