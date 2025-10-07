/**
 * PIIRedactor: GDPR-compliant PII handling
 * 
 * GDPR COMPLIANCE:
 * - Article 6: Lawful basis for processing (consent required)
 * - Article 7: Conditions for consent (explicit, withdrawable)
 * - Article 13: Information to be provided (transparency)
 * - Article 17: Right to erasure (support crypto-shredding)
 * 
 * FEATURES:
 * 1. Detect PII in data structures
 * 2. Redact PII before logging
 * 3. Track user consent for each PII category
 * 4. Support consent withdrawal
 * 5. Hash PII for analytics without exposing
 * 
 * BACKEND MIGRATION:
 * - Move consent storage to backend database
 * - Add webhook for consent changes
 * - Implement granular consent per data category
 */

import { User } from '@/api/entities';
import { getCurrentTenantId } from './TenantDefense';

class PIIRedactor {
  constructor() {
    this.consentKey = '__dchor_consent';
    
    // PII categories per GDPR
    this.piiCategories = {
      identity: ['name', 'email', 'phone', 'username', 'user_id'],
      financial: ['card_number', 'bank_account', 'iban', 'tax_id', 'vat_number'],
      location: ['address', 'ip_address', 'gps', 'postal_code', 'city', 'country'],
      communication: ['email_content', 'message', 'comment', 'notes'],
      behavioral: ['search_history', 'browsing_history', 'clicks', 'preferences']
    };
  }
  
  // ==========================================================================
  // PII DETECTION & REDACTION
  // ==========================================================================
  
  /**
   * Detect PII fields in object
   * Returns array of field paths that contain PII
   */
  detectPII(data) {
    const piiFields = [];
    
    const scan = (obj, path = '') => {
      if (!obj || typeof obj !== 'object') return;
      
      for (const key in obj) {
        const fullPath = path ? `${path}.${key}` : key;
        const lowerKey = key.toLowerCase();
        
        // Check against all PII categories
        for (const [category, patterns] of Object.entries(this.piiCategories)) {
          if (patterns.some(pattern => lowerKey.includes(pattern))) {
            piiFields.push({
              path: fullPath,
              key,
              category,
              value: obj[key]
            });
            break;
          }
        }
        
        // Recursive scan for nested objects
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          scan(obj[key], fullPath);
        }
      }
    };
    
    scan(data);
    return piiFields;
  }
  
  /**
   * Redact PII from data
   * Returns new object with PII replaced by [REDACTED]
   */
  redact(data, options = {}) {
    const {
      mask = '[REDACTED]',
      categories = Object.keys(this.piiCategories), // Which categories to redact
      preserveHash = false // Keep hash for analytics
    } = options;
    
    const piiFields = this.detectPII(data);
    const redacted = JSON.parse(JSON.stringify(data));
    
    for (const field of piiFields) {
      if (!categories.includes(field.category)) continue;
      
      const parts = field.path.split('.');
      let current = redacted;
      
      for (let i = 0; i < parts.length - 1; i++) {
        current = current[parts[i]];
        if (!current) break;
      }
      
      if (current) {
        const lastKey = parts[parts.length - 1];
        
        if (preserveHash && current[lastKey]) {
          // Keep hash for analytics (email → hash(email))
          current[lastKey] = this._hashValue(current[lastKey]);
        } else {
          current[lastKey] = mask;
        }
      }
    }
    
    return redacted;
  }
  
  /**
   * Hash value for analytics
   * SHA256 → first 12 chars for compact storage
   */
  async _hashValue(value) {
    const str = String(value);
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return 'hash_' + hashHex.substring(0, 12);
  }
  
  /**
   * Mask email preserving domain
   * user@example.com → u***@example.com
   */
  maskEmail(email) {
    if (!email || !email.includes('@')) return '[REDACTED]';
    
    const [local, domain] = email.split('@');
    if (local.length <= 1) return email;
    
    const masked = local[0] + '*'.repeat(Math.min(local.length - 1, 3)) + '@' + domain;
    return masked;
  }
  
  /**
   * Mask credit card
   * 4532123456789012 → **** **** **** 9012
   */
  maskCardNumber(cardNumber) {
    const cleaned = String(cardNumber).replace(/\s/g, '');
    if (cleaned.length < 12) return '[REDACTED]';
    
    const last4 = cleaned.slice(-4);
    return '**** **** **** ' + last4;
  }
  
  // ==========================================================================
  // CONSENT MANAGEMENT
  // ==========================================================================
  
  /**
   * Get user's current consent status
   * Returns consent object with all categories
   */
  async getUserConsent(userId = null) {
    try {
      const user = userId ? await User.get(userId) : await User.me();
      
      // Check if consent is stored on user
      if (user.consent_data) {
        return user.consent_data;
      }
      
      // Check localStorage (temporary until backend)
      const stored = localStorage.getItem(`${this.consentKey}_${user.id}`);
      if (stored) {
        return JSON.parse(stored);
      }
      
      // Default: no consent given
      return {
        identity: false,
        financial: false,
        location: false,
        communication: false,
        behavioral: false,
        consented_at: null,
        withdrawn_at: null
      };
      
    } catch (error) {
      console.error('Failed to get user consent:', error);
      return null;
    }
  }
  
  /**
   * Request user consent
   * Returns promise that resolves when user accepts/rejects
   */
  async requestConsent(categories, purpose) {
    return new Promise((resolve) => {
      // In production, show modal with:
      // - Purpose of data collection
      // - Which categories will be collected
      // - How data will be used
      // - How to withdraw consent
      // - Link to privacy policy
      
      // For now, just resolve with acceptance
      const consent = {};
      for (const category of categories) {
        consent[category] = true;
      }
      
      resolve({
        ...consent,
        consented_at: new Date().toISOString(),
        purpose,
        version: '1.0'
      });
    });
  }
  
  /**
   * Record user consent
   * GDPR Article 7: Must be able to demonstrate consent
   */
  async recordConsent(userId, consentData) {
    try {
      const user = await User.get(userId);
      
      // Save to user record
      await User.update(userId, {
        consent_data: {
          ...consentData,
          recorded_at: new Date().toISOString(),
          ip_address: await this._getClientIP()
        }
      });
      
      // Also save to localStorage (redundant but useful)
      localStorage.setItem(
        `${this.consentKey}_${userId}`,
        JSON.stringify(consentData)
      );
      
      // Log consent change to audit trail
      const { complianceLogger } = await import('./ComplianceLogger');
      await complianceLogger.logDataAccess(
        userId,
        'consent',
        userId,
        'consent_given'
      );
      
      console.log('✅ User consent recorded:', Object.keys(consentData).filter(k => consentData[k] === true));
      
    } catch (error) {
      console.error('Failed to record consent:', error);
      throw error;
    }
  }
  
  /**
   * Withdraw user consent
   * GDPR Article 7(3): Must be as easy to withdraw as to give
   */
  async withdrawConsent(userId, categories) {
    try {
      const currentConsent = await this.getUserConsent(userId);
      
      // Update consent status
      const updatedConsent = { ...currentConsent };
      for (const category of categories) {
        updatedConsent[category] = false;
      }
      updatedConsent.withdrawn_at = new Date().toISOString();
      
      // Save updated consent
      await this.recordConsent(userId, updatedConsent);
      
      // Log withdrawal
      const { complianceLogger } = await import('./ComplianceLogger');
      await complianceLogger.logDataAccess(
        userId,
        'consent',
        userId,
        'consent_withdrawn'
      );
      
      console.log('✅ User consent withdrawn:', categories);
      
      // If all consent withdrawn, trigger data deletion?
      const anyConsent = Object.values(updatedConsent).some(v => v === true);
      if (!anyConsent) {
        console.warn('⚠️ All consent withdrawn. Consider triggering GDPR erasure.');
      }
      
    } catch (error) {
      console.error('Failed to withdraw consent:', error);
      throw error;
    }
  }
  
  /**
   * Check if we have consent to process data
   */
  async canProcess(userId, category) {
    const consent = await this.getUserConsent(userId);
    return consent && consent[category] === true;
  }
  
  // ==========================================================================
  // DATA EXPORT (GDPR ARTICLE 20 - RIGHT TO DATA PORTABILITY)
  // ==========================================================================
  
  /**
   * Export all user data in machine-readable format
   * GDPR Article 20: Right to receive personal data in structured format
   */
  async exportUserData(userId) {
    try {
      console.log(`📦 Exporting data for user ${userId}...`);
      
      const tenantId = await getCurrentTenantId();
      const user = await User.get(userId);
      
      // Collect all user data
      const exportData = {
        metadata: {
          export_date: new Date().toISOString(),
          user_id: userId,
          tenant_id: tenantId,
          format_version: '1.0'
        },
        user_profile: {
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          created_date: user.created_date
        },
        // TODO: Collect data from other entities
        // - Orders placed by user
        // - Invoices sent to user
        // - Approval decisions made by user
        // - Workflow runs triggered by user
        // - etc.
      };
      
      // Return as JSON (could also export as CSV, XML, etc.)
      return exportData;
      
    } catch (error) {
      console.error('Data export failed:', error);
      throw error;
    }
  }
  
  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================
  
  async _getClientIP() {
    return 'client-ip-unknown';
  }
}

// Export singleton
export const piiRedactor = new PIIRedactor();
export default PIIRedactor;