/**
 * TenantLeakDetector: Real-time monitoring for cross-tenant data leaks
 * Runs in background, alerts immediately on violations
 */

import { getComplianceVerifier } from './ComplianceVerifier';

class TenantLeakDetector {
  constructor() {
    this.violations = [];
    this.alertThreshold = 1; // Alert on ANY violation
    this.checkInterval = 60000; // Check every minute
    
    this.startMonitoring();
  }
  
  async startMonitoring() {
    // Check localStorage for stored violations
    this.checkStoredViolations();
    
    // Periodic check
    setInterval(() => {
      this.checkStoredViolations();
    }, this.checkInterval);
  }
  
  checkStoredViolations() {
    try {
      const stored = localStorage.getItem('security_violations');
      if (stored) {
        const violations = JSON.parse(stored);
        
        if (violations.length >= this.alertThreshold) {
          this.alertAdmin(violations);
        }
      }
    } catch (error) {
      console.error('Failed to check violations:', error);
    }
  }
  
  alertAdmin(violations) {
    // Visual alert
    const alert = document.createElement('div');
    alert.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #dc2626;
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      z-index: 9999;
      max-width: 400px;
    `;
    alert.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 8px;">
        🚨 SECURITY ALERT
      </div>
      <div style="font-size: 14px;">
        ${violations.length} tenant isolation violation(s) detected.
        <br/>
        <a href="/SecuritySelfTest" style="color: white; text-decoration: underline;">
          View Details →
        </a>
      </div>
    `;
    
    document.body.appendChild(alert);
    
    // Auto-remove after 30 seconds
    setTimeout(() => {
      alert.remove();
    }, 30000);
    
    // Play alert sound
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSmJ0fPTgjMGHm7A7+OZUQ0PVqzn77BdGAlBluPvz3ElBSh+zPLaizsIGGS57OyhUQ0NTqXm8LJeHQc+k9r0xnMoBSR6yfDakjsKF2G16+ijUw0NTqTl8LJeHQc9ktr0xnMoBSR6yfDakjsKF2G16+ijUw0NTqTl8LJeHQc9ktr0xnMoBSR6yfDakjsKF2G16+ijUw0NTqTl8LJeHQc9ktr0xnMoBSR6yfDakjsKF2G16+ijUw0NTqTl8LJeHQc9ktr0xnMoBSR6yfDakjsKF2G16+ijUw0NTqTl8LJeHQc9ktr0xnMoBSR6yfDakjsKF2G16+ijUw0NTqTl8LJeHQc9ktr0xnMoBSR6yfDakjsKF2G16+ijUw0NTqTl8LJeHQc9ktr0xnMoBSR6yfDakjsKF2G16+ijUw0NTqTl8LJeHQc9ktr0xnMoBSR6yfDakjsKF2G16+ijUw0NTqTl8LJeHQc9ktr0xnMoBSR6yfDakjsKF2G16+ijUw0NTqTl8LJeHQc9ktr0xnMoBSR6yfDakjsKF2G16+ijUw0NTqTl8LJeHQc9ktr0xnMoBSR6yfDakjsKF2G16+ijUw0NTqTl8LJeHQc9ktr0xnMoBSR6yfDakjsKF2G16+ijUw0NTqTl8LJeHQc9ktr0xnMoBSR6yfDakjsKF2G16+ijUw0NTqTl8LJeHQc9ktr0xnMoBSR6yfDakjsKF2G16+ijUw0NTqTl8LJeHQc9ktr0xnMoBSR6yfDakjsKF2G16+ijUw0NTqTl8LJeHQ=');
      audio.play().catch(() => {});
    } catch (e) {}
  }
}

// Auto-start on import
const detector = new TenantLeakDetector();

export default detector;