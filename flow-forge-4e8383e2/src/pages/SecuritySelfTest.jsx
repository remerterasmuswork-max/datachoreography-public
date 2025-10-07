import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, Loader } from 'lucide-react';
import TenantEntity, { getCurrentTenantId } from '../components/TenantEntity';
import { enableTenantAudit, disableTenantAudit, analyzeTenantAudit } from '../components/TenantFilter';
import { Run, Workflow, Approval, ComplianceEvent } from '@/api/entities';

export default function SecuritySelfTest() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState(null);

  const runSecurityTests = async () => {
    setTesting(true);
    setResults(null);

    const testResults = {
      tenantIsolation: null,
      crossTenantAccess: null,
      auditLog: null,
      timestamp: new Date().toISOString()
    };

    try {
      // Test 1: Tenant Isolation
      console.log('Running Test 1: Tenant Isolation...');
      enableTenantAudit();
      
      const currentTenantId = await getCurrentTenantId();
      
      // Simulate typical app usage
      const TenantRun = TenantEntity.wrap(Run);
      const TenantWorkflow = TenantEntity.wrap(Workflow);
      const TenantApproval = TenantEntity.wrap(Approval);
      
      await TenantRun.list('-started_at', 10);
      await TenantWorkflow.list();
      await TenantApproval.filter({ state: 'pending' });
      
      const audit = analyzeTenantAudit();
      disableTenantAudit();
      
      testResults.auditLog = audit;
      testResults.tenantIsolation = {
        passed: audit.violations === 0,
        totalOperations: audit.totalOperations,
        violations: audit.violations,
        violationsByEntity: audit.violationsByEntity
      };

      // Test 2: Cross-Tenant Access Prevention
      console.log('Running Test 2: Cross-Tenant Access Prevention...');
      try {
        // Try to access data without tenant filter (should fail)
        const directRuns = await Run.list();
        
        // Check if any runs belong to other tenants
        const foreignRuns = directRuns.filter(r => r.tenant_id !== currentTenantId);
        
        testResults.crossTenantAccess = {
          passed: foreignRuns.length === 0,
          currentTenant: currentTenantId,
          totalRecords: directRuns.length,
          foreignRecords: foreignRuns.length,
          message: foreignRuns.length > 0 
            ? `CRITICAL: Found ${foreignRuns.length} records from other tenants!`
            : 'All records belong to current tenant'
        };
      } catch (error) {
        testResults.crossTenantAccess = {
          passed: true,
          message: 'Direct entity access blocked (good!)',
          error: error.message
        };
      }

      // Test 3: User Entity Special Case
      console.log('Running Test 3: User Entity Access...');
      try {
        const User = (await import('@/api/entities')).User;
        const me = await User.me();
        const allUsers = await User.list();
        
        // Non-admin should only see themselves
        testResults.userAccess = {
          passed: me.role === 'admin' || allUsers.length === 1,
          myEmail: me.email,
          myRole: me.role,
          visibleUsers: allUsers.length,
          message: me.role === 'admin' 
            ? 'Admin can see all users (expected)'
            : allUsers.length === 1
            ? 'Non-admin sees only self (correct)'
            : `VIOLATION: Non-admin sees ${allUsers.length} users!`
        };
      } catch (error) {
        testResults.userAccess = {
          passed: false,
          error: error.message
        };
      }

    } catch (error) {
      testResults.error = error.message;
    } finally {
      setTesting(false);
      setResults(testResults);
    }
  };

  const allPassed = results && 
    results.tenantIsolation?.passed && 
    results.crossTenantAccess?.passed &&
    results.userAccess?.passed;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Security Self-Test</h1>
          <p className="text-gray-600 mt-2">Automated tenant isolation verification</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Test Suite</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={runSecurityTests}
              disabled={testing}
              className="w-full"
            >
              {testing ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Running Tests...
                </>
              ) : (
                'Run Security Tests'
              )}
            </Button>
          </CardContent>
        </Card>

        {results && (
          <>
            <Card className={`mb-6 ${allPassed ? 'border-green-500' : 'border-red-500'}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Overall Result</CardTitle>
                  {allPassed ? (
                    <Badge className="bg-green-100 text-green-800 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      All Tests Passed
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800 flex items-center gap-2">
                      <XCircle className="w-4 h-4" />
                      Security Violations Detected
                    </Badge>
                  )}
                </div>
              </CardHeader>
            </Card>

            {/* Test 1: Tenant Isolation */}
            <Card className="mb-4">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Test 1: Tenant Isolation</CardTitle>
                  {results.tenantIsolation?.passed ? (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-500" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {results.tenantIsolation && (
                  <div className="space-y-2 text-sm">
                    <p>Total Operations: {results.tenantIsolation.totalOperations}</p>
                    <p>Violations: {results.tenantIsolation.violations}</p>
                    {results.tenantIsolation.violations > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded p-3 mt-3">
                        <p className="font-semibold text-red-900 mb-2">Violations by Entity:</p>
                        <pre className="text-xs">
                          {JSON.stringify(results.tenantIsolation.violationsByEntity, null, 2)}
                        </pre>
                      </div>
                    )}
                    {results.auditLog?.details && results.auditLog.details.length > 0 && (
                      <details className="mt-3">
                        <summary className="cursor-pointer font-semibold">
                          View Violation Details
                        </summary>
                        <div className="mt-2 space-y-3">
                          {results.auditLog.details.map((detail, idx) => (
                            <div key={idx} className="bg-gray-50 p-3 rounded text-xs">
                              <p><strong>Entity:</strong> {detail.entity}</p>
                              <p><strong>Operation:</strong> {detail.operation}</p>
                              <p><strong>Filters:</strong> {JSON.stringify(detail.filters)}</p>
                              <pre className="mt-2 text-[10px] text-gray-600">{detail.stack}</pre>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Test 2: Cross-Tenant Access */}
            <Card className="mb-4">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Test 2: Cross-Tenant Access Prevention</CardTitle>
                  {results.crossTenantAccess?.passed ? (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-500" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {results.crossTenantAccess && (
                  <div className="space-y-2 text-sm">
                    <p className={results.crossTenantAccess.passed ? 'text-green-700' : 'text-red-700'}>
                      {results.crossTenantAccess.message}
                    </p>
                    {results.crossTenantAccess.foreignRecords > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded p-3 mt-2">
                        <p className="font-semibold text-red-900">⚠️ CRITICAL SECURITY VIOLATION</p>
                        <p className="text-red-800 mt-1">
                          Found {results.crossTenantAccess.foreignRecords} records from other tenants!
                        </p>
                        <p className="text-xs text-red-700 mt-2">
                          This indicates a serious tenant isolation failure. 
                          All entity queries must use TenantEntity.wrap().
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Test 3: User Access */}
            <Card className="mb-4">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Test 3: User Entity Access Control</CardTitle>
                  {results.userAccess?.passed ? (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-500" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {results.userAccess && (
                  <div className="space-y-2 text-sm">
                    <p>Role: {results.userAccess.myRole}</p>
                    <p>Visible Users: {results.userAccess.visibleUsers}</p>
                    <p className={results.userAccess.passed ? 'text-green-700' : 'text-red-700'}>
                      {results.userAccess.message}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {results.error && (
              <Card className="border-red-500">
                <CardHeader>
                  <CardTitle className="text-red-700">Test Error</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-red-600 text-sm">{results.error}</p>
                </CardContent>
              </Card>
            )}
          </>
        )}

        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">Security Best Practices</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-800 space-y-2">
            <p>✅ Always use <code className="bg-blue-100 px-1 rounded">TenantEntity.wrap(Entity)</code> for data access</p>
            <p>✅ Never call <code className="bg-blue-100 px-1 rounded">Entity.list()</code> or <code className="bg-blue-100 px-1 rounded">Entity.filter()</code> directly</p>
            <p>✅ Run this test before every deployment</p>
            <p>✅ Zero violations required for production</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}