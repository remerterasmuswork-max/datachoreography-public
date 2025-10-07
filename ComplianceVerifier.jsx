/**
 * ComplianceVerifier: Cryptographic verification of audit chain
 * 
 * APPROACH: Periodically verify chain integrity + merkle proofs
 * 
 * LIMITATIONS:
 * - Can detect tampering but cannot prevent it
 * - Cannot detect if backend deletes events before frontend sees them
 * - Relies on client-side crypto (can be bypassed)
 * 
 * MITIGATION: Store anchor hashes in external immutable ledger
 */

import TenantEntity from './TenantEntity';
import { ComplianceEvent, ComplianceAnchor } from '@/api/entities';

class ComplianceVerifier {
  constructor() {
    this.lastVerification = null;
    this.verificationInterval = 3600000; // 1 hour
    this.startPeriodicVerification();
  }
  
  // =========================================================================
  // CHAIN VERIFICATION
  // =========================================================================
  
  async verifyChain(startDate, endDate) {
    const TenantComplianceEvent = TenantEntity.wrap(ComplianceEvent);
    
    // Fetch events in chronological order
    const events = await TenantComplianceEvent.filter({
      ts: { $gte: startDate, $lte: endDate }
    }, 'ts', 100000);
    
    if (events.length === 0) {
      return { valid: true, violations: [], message: 'No events in period' };
    }
    
    const violations = [];
    
    // Verify chain links
    for (let i = 1; i < events.length; i++) {
      const current = events[i];
      const previous = events[i - 1];
      
      // Check 1: Previous digest matches
      if (current.prev_digest_sha256 !== previous.digest_sha256) {
        violations.push({
          type: 'CHAIN_BREAK',
          event_id: current.id,
          event_index: i,
          expected_prev: previous.digest_sha256,
          actual_prev: current.prev_digest_sha256,
          severity: 'critical'
        });
      }
      
      // Check 2: Digest matches content
      const computedDigest = await this.computeEventDigest(current);
      if (computedDigest !== current.digest_sha256) {
        violations.push({
          type: 'DIGEST_MISMATCH',
          event_id: current.id,
          event_index: i,
          expected_digest: computedDigest,
          actual_digest: current.digest_sha256,
          severity: 'critical'
        });
      }
      
      // Check 3: Timestamp ordering
      if (new Date(current.ts) < new Date(previous.ts)) {
        violations.push({
          type: 'TIMESTAMP_VIOLATION',
          event_id: current.id,
          event_index: i,
          severity: 'high'
        });
      }
    }
    
    return {
      valid: violations.length === 0,
      total_events: events.length,
      violations,
      first_event: events[0].ts,
      last_event: events[events.length - 1].ts
    };
  }
  
  async computeEventDigest(event) {
    // Canonical representation (order matters!)
    const canonical = JSON.stringify({
      tenant_id: event.tenant_id,
      category: event.category,
      event_type: event.event_type,
      actor: event.actor,
      payload: event.payload,
      ts: event.ts
    });
    
    // SHA-256 hash
    const encoder = new TextEncoder();
    const data = encoder.encode(canonical);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex;
  }
  
  // =========================================================================
  // ANCHOR VERIFICATION
  // =========================================================================
  
  async verifyAnchors() {
    const TenantComplianceAnchor = TenantEntity.wrap(ComplianceAnchor);
    const TenantComplianceEvent = TenantEntity.wrap(ComplianceEvent);
    
    const anchors = await TenantComplianceAnchor.list('-computed_at', 100);
    const violations = [];
    
    for (const anchor of anchors) {
      // Fetch all events in this anchor period
      const events = await TenantComplianceEvent.filter({
        ts: { $gte: anchor.from_ts, $lte: anchor.to_ts }
      }, 'ts', 100000);
      
      // Check event count
      if (events.length !== anchor.event_count) {
        violations.push({
          anchor_id: anchor.id,
          type: 'EVENT_COUNT_MISMATCH',
          expected: anchor.event_count,
          actual: events.length,
          severity: 'critical',
          message: events.length < anchor.event_count 
            ? 'Events missing from chain'
            : 'Extra events in chain'
        });
      }
      
      // Recompute merkle root
      const digests = events.map(e => e.digest_sha256);
      const computedRoot = await this.computeMerkleRoot(digests);
      
      if (computedRoot !== anchor.anchor_sha256) {
        violations.push({
          anchor_id: anchor.id,
          type: 'MERKLE_ROOT_MISMATCH',
          expected: anchor.anchor_sha256,
          actual: computedRoot,
          severity: 'critical',
          message: 'Anchor merkle root does not match recomputed value'
        });
      }
      
      // Verify HMAC (NOTE: This is weak without backend secret)
      // We can only verify client-side HMAC, which attacker can recompute
      // This is a defense-in-depth measure, not cryptographically secure
    }
    
    return {
      valid: violations.length === 0,
      total_anchors: anchors.length,
      violations
    };
  }
  
  async computeMerkleRoot(digests) {
    if (digests.length === 0) return '';
    if (digests.length === 1) return digests[0];
    
    // Build merkle tree bottom-up
    let level = digests;
    
    while (level.length > 1) {
      const nextLevel = [];
      
      for (let i = 0; i < level.length; i += 2) {
        if (i + 1 < level.length) {
          // Hash pair
          const combined = level[i] + level[i + 1];
          const hash = await this.hashString(combined);
          nextLevel.push(hash);
        } else {
          // Odd one out, promote to next level
          nextLevel.push(level[i]);
        }
      }
      
      level = nextLevel;
    }
    
    return level[0];
  }
  
  async hashString(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  // =========================================================================
  // PERIODIC VERIFICATION
  // =========================================================================
  
  startPeriodicVerification() {
    // Verify on load
    this.runVerification();
    
    // Verify every hour
    setInterval(() => {
      this.runVerification();
    }, this.verificationInterval);
  }
  
  async runVerification() {
    try {
      console.log('🔍 Running compliance verification...');
      
      // Verify last 7 days of chain
      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      
      const chainResult = await this.verifyChain(startDate, endDate);
      const anchorResult = await this.verifyAnchors();
      
      const allViolations = [
        ...chainResult.violations,
        ...anchorResult.violations
      ];
      
      if (allViolations.length > 0) {
        console.error('🚨 COMPLIANCE VIOLATIONS DETECTED:', allViolations);
        
        // Store violations for admin review
        localStorage.setItem('compliance_violations', JSON.stringify({
          timestamp: Date.now(),
          chain_result: chainResult,
          anchor_result: anchorResult
        }));
        
        // TODO: Send alert to admin
      } else {
        console.log('✅ Compliance verification passed');
      }
      
      this.lastVerification = {
        timestamp: Date.now(),
        chain_result: chainResult,
        anchor_result: anchorResult
      };
      
    } catch (error) {
      console.error('Compliance verification failed:', error);
    }
  }
  
  getLastVerification() {
    return this.lastVerification;
  }
}

// Global singleton
let verifier = null;

export function getComplianceVerifier() {
  if (!verifier) {
    verifier = new ComplianceVerifier();
  }
  return verifier;
}

export async function verifyComplianceChain(startDate, endDate) {
  const verifier = getComplianceVerifier();
  return await verifier.verifyChain(startDate, endDate);
}

export async function verifyComplianceAnchors() {
  const verifier = getComplianceVerifier();
  return await verifier.verifyAnchors();
}

export default ComplianceVerifier;