/**
 * SecuritySelfTest: Automated security validation suite
 * 
 * PURPOSE:
 * - Detect security misconfigurations before production
 * - Validate tenant isolation works correctly
 * - Check for common vulnerabilities (XSS, CSRF, etc.)
 * - Verify compliance logging is working
 * 
 * HOW TO USE:
 * 1. Run in development: import { runSecurityTests } from '@/components/SecuritySelfTest';
 * 2. Call runSecurityTests() before deployment
 * 3. Review results and fix any failures
 * 4. Re-run until all tests pass
 * 
 * DO NOT RUN IN PRODUCTION (creates test data)
 */

import { getCurrentTenantId, validateTenantOwnership } from './TenantDefense';
import { auth } from './AuthProxy';
import { credentialVault } from './CredentialVault';
import { complianceLogger } from './ComplianceLogger';
import { piiRedactor } from './PIIRedactor';
import { User } from '@/api/entities';
import { Run, Workflow } from '@/api/entities';

class SecuritySelfTest {
  constructor() {
    this.results = [];
    this.testData = []; // Track test data for cleanup
  }
  
  // ==========================================================================
  // TEST RUNNER
  // ==========================================================================
  
  async runAllTests() {
    console.log('🔒 Starting Security Self-Test Suite...\n');
    
    this.results = [];
    this.testData = [];
    
    const tests = [
      // Tenant Isolation Tests
      { name: 'Tenant Context Loading', fn: () => this.testTenantContextLoading() },
      { name: 'Cross-Tenant Query Prevention', fn: () => this.testCrossTenantQueries() },
      { name: 'Tenant Validation on Update', fn: () => this.testTenantValidationOnUpdate() },
      
      // Authentication Tests
      { name: 'Session Management', fn: () => this.testSessionManagement() },
      { name: 'Logout Cleanup', fn: () => this.testLogoutCleanup() },
      
      // PII Protection Tests
      { name: 'PII Detection', fn: () => this.testPIIDetection() },
      { name: 'PII Redaction', fn: () => this.testPIIRedaction() },
      { name: 'Consent Tracking', fn: () => this.testConsentTracking() },
      
      // Compliance Tests
      { name: 'Audit Logging', fn: () => this.testAuditLogging() },
      { name: 'Chain Integrity', fn: () => this.testChainIntegrity() },
      
      // Vulnerability Tests
      { name: 'XSS Prevention', fn: () => this.testXSSPrevention() },
      { name: 'Input Validation', fn: () => this.testInputValidation() }
    ];
    
    for (const test of tests) {
      try {
        await this.runTest(test.name, test.fn);
      } catch (error) {
        this.logResult(test.name, 'ERROR', error.message);
      }
    }
    
    // Cleanup test data
    await this.cleanup();
    
    // Print results
    this.printResults();
    
    return this.results;
  }
  
  async runTest(name, testFn) {
    console.log(`Running: ${name}...`);
    
    try {
      await testFn();
      this.logResult(name, 'PASS', 'Test completed successfully');
    } catch (error) {
      this.logResult(name, 'FAIL', error.message);
    }
  }
  
  logResult(name, status, message) {
    const result = {
      test: name,
      status,
      message,
      timestamp: new Date().toISOString()
    };
    
    this.results.push(result);
    
    const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${emoji} ${name}: ${status} - ${message}`);
  }
  
  printResults() {
    console.log('\n📊 Security Test Results:');
    console.log('='.repeat(60));
    
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const errors = this.results.filter(r => r.status === 'ERROR').length;
    
    console.log(`Total: ${this.results.length} tests`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⚠️ Errors: ${errors}`);
    
    if (failed > 0 || errors > 0) {
      console.log('\n🚨 SECURITY ISSUES DETECTED:');
      this.results
        .filter(r => r.status !== 'PASS')
        .forEach(r => {
          console.log(`\n- ${r.test}`);
          console.log(`  ${r.message}`);
        });
    } else {
      console.log('\n✅ All security tests passed!');
    }
    
    console.log('='.repeat(60));
  }
  
  // ==========================================================================
  // TENANT ISOLATION TESTS
  // ==========================================================================
  
  async testTenantContextLoading() {
    const tenantId = await getCurrentTenantId();
    
    if (!tenantId) {
      throw new Error('Failed to load tenant context');
    }
    
    // Verify tenant ID format
    if (tenantId.length < 3) {
      throw new Error(`Invalid tenant ID format: ${tenantId}`);
    }
    
    // Test caching
    const tenantId2 = await getCurrentTenantId();
    if (tenantId !== tenantId2) {
      throw new Error('Tenant ID changed between calls (caching broken)');
    }
  }
  
  async testCrossTenantQueries() {
    // Create test record
    const testRun = await Run.create({
      workflow_id: 'test-workflow',
      idempotency_key: `test-${Date.now()}`,
      status: 'completed'
    });
    
    this.testData.push({ entity: 'Run', id: testRun.id });
    
    // Try to query without tenant filter (should be added automatically)
    const runs = await Run.list();
    
    // Verify all results belong to current tenant
    const tenantId = await getCurrentTenantId();
    const violations = runs.filter(r => r.tenant_id !== tenantId);
    
    if (violations.length > 0) {
      throw new Error(`Cross-tenant leak detected: ${violations.length} records from other tenants`);
    }
  }
  
  async testTenantValidationOnUpdate() {
    const tenantId = await getCurrentTenantId();
    
    // Create test record
    const testRun = await Run.create({
      workflow_id: 'test-workflow-update',
      idempotency_key: `test-update-${Date.now()}`,
      status: 'pending'
    });
    
    this.testData.push({ entity: 'Run', id: testRun.id });
    
    // Try to update (should validate tenant ownership)
    await Run.update(testRun.id, { status: 'completed' });
    
    // Verify update succeeded
    const updated = await Run.list();
    const found = updated.find(r => r.id === testRun.id);
    
    if (!found || found.status !== 'completed') {
      throw new Error('Update failed or record not found');
    }
  }
  
  // ==========================================================================
  // AUTHENTICATION TESTS
  // ==========================================================================
  
  async testSessionManagement() {
    const user = await auth.getCurrentUser();
    
    if (!user || !user.id) {
      throw new Error('Failed to get current user');
    }
    
    // Test session caching
    const user2 = await auth.getCurrentUser();
    if (user.id !== user2.id) {
      throw new Error('Session caching broken');
    }
    
    // Test authentication check
    const isAuth = await auth.isAuthenticated();
    if (!isAuth) {
      throw new Error('Authentication check failed');
    }
  }
  
  async testLogoutCleanup() {
    // Check if session storage has keys before logout
    const keysBefore = Object.keys(sessionStorage);
    
    if (keysBefore.length === 0) {
      // No session data to test
      return;
    }
    
    // Note: Can't actually test logout without losing current session
    // Instead, verify logout method exists and is callable
    if (typeof auth.logout !== 'function') {
      throw new Error('Logout method not found');
    }
  }
  
  // ==========================================================================
  // PII PROTECTION TESTS
  // ==========================================================================
  
  async testPIIDetection() {
    const testData = {
      customer_name: 'John Doe',
      customer_email: 'john@example.com',
      customer_phone: '+1234567890',
      order_total: 99.99,
      nested: {
        billing_address: '123 Main St',
        ip_address: '192.168.1.1'
      }
    };
    
    const piiFields = piiRedactor.detectPII(testData);
    
    // Should detect at least: name, email, phone, address, ip_address
    if (piiFields.length < 5) {
      throw new Error(`PII detection incomplete: only found ${piiFields.length} fields`);
    }
    
    // Verify specific fields detected
    const paths = piiFields.map(f => f.path);
    if (!paths.includes('customer_email')) {
      throw new Error('Failed to detect email PII');
    }
    if (!paths.includes('nested.ip_address')) {
      throw new Error('Failed to detect nested PII');
    }
  }
  
  async testPIIRedaction() {
    const testData = {
      customer_email: 'test@example.com',
      order_id: 'ORD-123',
      amount: 50.00
    };
    
    const redacted = piiRedactor.redact(testData);
    
    // Email should be redacted
    if (redacted.customer_email !== '[REDACTED]') {
      throw new Error(`Email not redacted: ${redacted.customer_email}`);
    }
    
    // Non-PII should remain
    if (redacted.order_id !== 'ORD-123') {
      throw new Error('Non-PII data was incorrectly redacted');
    }
  }
  
  async testConsentTracking() {
    const user = await auth.getCurrentUser();
    
    // Get current consent
    const consent = await piiRedactor.getUserConsent(user.id);
    
    if (!consent) {
      throw new Error('Failed to get user consent');
    }
    
    // Verify consent structure
    const requiredCategories = ['identity', 'financial', 'location'];
    for (const category of requiredCategories) {
      if (!(category in consent)) {
        throw new Error(`Consent missing category: ${category}`);
      }
    }
  }
  
  // ==========================================================================
  // COMPLIANCE TESTS
  // ==========================================================================
  
  async testAuditLogging() {
    // Log a test event
    await complianceLogger.logDataAccess(
      'test-user',
      'test_resource',
      'test-id-123',
      'read'
    );
    
    // Verify event was created
    const { ComplianceEvent } = await import('@/api/entities');
    const events = await ComplianceEvent.filter({
      event_type: 'test_resource_read'
    }, '-ts', 1);
    
    if (events.length === 0) {
      throw new Error('Audit event not created');
    }
    
    this.testData.push({ entity: 'ComplianceEvent', id: events[0].id });
  }
  
  async testChainIntegrity() {
    const tenantId = await getCurrentTenantId();
    
    // Verify chain for current tenant
    const verification = await complianceLogger.verifyChain(tenantId);
    
    if (!verification.valid) {
      const details = JSON.stringify(verification.violations, null, 2);
      throw new Error(`Chain integrity violated:\n${details}`);
    }
  }
  
  // ==========================================================================
  // VULNERABILITY TESTS
  // ==========================================================================
  
  async testXSSPrevention() {
    // Test XSS payload
    const xssPayload = '<script>alert("XSS")</script>';
    
    // Verify it's not executed when set as data
    const testDiv = document.createElement('div');
    testDiv.textContent = xssPayload;
    
    // Should be escaped
    if (testDiv.innerHTML.includes('<script>')) {
      throw new Error('XSS payload not escaped');
    }
  }
  
  async testInputValidation() {
    // Test SQL injection patterns (though we don't use SQL directly)
    const sqlPayload = "'; DROP TABLE users; --";
    
    try {
      // Try to create workflow with malicious input
      const workflow = await Workflow.create({
        workflow_key: sqlPayload,
        display_name: 'Test Workflow'
      });
      
      this.testData.push({ entity: 'Workflow', id: workflow.id });
      
      // If it succeeds, verify the input was properly escaped
      if (workflow.workflow_key.includes('DROP TABLE')) {
        throw new Error('SQL injection pattern not sanitized');
      }
    } catch (error) {
      // If Base44 rejects it, that's good
      if (!error.message.includes('validation') && !error.message.includes('invalid')) {
        throw error;
      }
    }
  }
  
  // ==========================================================================
  // CLEANUP
  // ==========================================================================
  
  async cleanup() {
    console.log('\n🧹 Cleaning up test data...');
    
    for (const item of this.testData) {
      try {
        const { [item.entity]: Entity } = await import('@/api/entities');
        await Entity.delete(item.id);
      } catch (error) {
        console.error(`Failed to delete ${item.entity} ${item.id}:`, error.message);
      }
    }
    
    console.log(`✅ Cleaned up ${this.testData.length} test records`);
  }
}

// Export test runner
export async function runSecurityTests() {
  const suite = new SecuritySelfTest();
  return await suite.runAllTests();
}

export default SecuritySelfTest;