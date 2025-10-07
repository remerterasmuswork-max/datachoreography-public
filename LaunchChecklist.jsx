import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Loader,
  Shield,
  Database,
  Lock,
  Users,
  FileText,
  Activity
} from 'lucide-react';
import { runSecurityTests } from '../components/SecuritySelfTest';

export default function LaunchChecklist() {
  const [checklist, setChecklist] = useState(getInitialChecklist());
  const [testResults, setTestResults] = useState(null);
  const [running, setRunning] = useState(false);

  const runTests = async () => {
    setRunning(true);
    try {
      const results = await runSecurityTests();
      setTestResults(results);
      
      // Update checklist based on test results
      const allPassed = results.every(r => r.status === 'PASS');
      updateChecklistItem('security', 'automated_tests', allPassed);
      
    } catch (error) {
      console.error('Security tests failed:', error);
    } finally {
      setRunning(false);
    }
  };

  const updateChecklistItem = (category, itemId, checked) => {
    setChecklist(prev => ({
      ...prev,
      [category]: prev[category].map(item =>
        item.id === itemId ? { ...item, checked } : item
      )
    }));
  };

  const getProgress = () => {
    const allItems = Object.values(checklist).flat();
    const checkedItems = allItems.filter(item => item.checked);
    const blockers = allItems.filter(item => item.blocker && !item.checked);
    
    return {
      total: allItems.length,
      checked: checkedItems.length,
      percentage: Math.round((checkedItems.length / allItems.length) * 100),
      blockers: blockers.length
    };
  };

  const progress = getProgress();
  const canLaunch = progress.blockers === 0;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Pre-Beta Launch Checklist</h1>
          <p className="text-gray-600 mt-2">
            Complete all items before inviting beta users
          </p>
        </div>

        {/* Progress Overview */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold">{progress.percentage}% Complete</h3>
                <p className="text-sm text-gray-600">
                  {progress.checked} of {progress.total} items completed
                </p>
              </div>
              
              {canLaunch ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-8 h-8" />
                  <span className="font-semibold">Ready for Beta</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-600">
                  <XCircle className="w-8 h-8" />
                  <span className="font-semibold">{progress.blockers} Blockers Remaining</span>
                </div>
              )}
            </div>

            <div className="w-full bg-gray-200 rounded-full h-4">
              <div 
                className="bg-indigo-600 h-4 rounded-full transition-all" 
                style={{ width: `${progress.percentage}%` }}
              />
            </div>

            {!canLaunch && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  <strong>⚠️ NOT READY FOR LAUNCH:</strong> {progress.blockers} blocking items must be completed before beta launch.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Automated Tests */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Automated Security Tests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={runTests}
              disabled={running}
              className="mb-4"
            >
              {running ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Running Tests...
                </>
              ) : (
                'Run Security Tests'
              )}
            </Button>

            {testResults && (
              <div className="space-y-2">
                {testResults.map((result, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    {result.status === 'PASS' ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span>{result.test}: {result.message}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Checklist Categories */}
        {Object.entries(checklist).map(([category, items]) => {
          const categoryProgress = Math.round(
            (items.filter(i => i.checked).length / items.length) * 100
          );

          return (
            <ChecklistCategory
              key={category}
              category={category}
              items={items}
              progress={categoryProgress}
              onToggle={(itemId, checked) => updateChecklistItem(category, itemId, checked)}
            />
          );
        })}
      </div>
    </div>
  );
}

function ChecklistCategory({ category, items, progress, onToggle }) {
  const icons = {
    security: Shield,
    tenant: Database,
    auth: Lock,
    compliance: FileText,
    operations: Activity,
    documentation: FileText
  };

  const Icon = icons[category] || Shield;

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Icon className="w-5 h-5" />
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </CardTitle>
          <Badge variant="outline">{progress}%</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50">
              <Checkbox
                checked={item.checked}
                onCheckedChange={(checked) => onToggle(item.id, checked)}
                className="mt-0.5"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={item.checked ? 'line-through text-gray-500' : ''}>
                    {item.title}
                  </span>
                  {item.blocker && !item.checked && (
                    <Badge className="bg-red-100 text-red-800">P0 BLOCKER</Badge>
                  )}
                </div>
                {item.description && (
                  <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function getInitialChecklist() {
  return {
    security: [
      {
        id: 'tenant_context',
        title: 'Tenant Context Provider Implemented',
        description: 'Session-scoped tenant isolation via React Context',
        checked: true, // We implemented this
        blocker: true
      },
      {
        id: 'tenant_defense',
        title: 'Multi-Layer Tenant Defense Active',
        description: 'TenantDefense component validating all queries',
        checked: true,
        blocker: true
      },
      {
        id: 'auth_proxy',
        title: 'AuthProxy Session Management',
        description: 'Centralized authentication with session validation',
        checked: true,
        blocker: false
      },
      {
        id: 'credential_vault',
        title: 'CredentialVault Abstraction',
        description: 'Placeholder for future HSM integration',
        checked: true,
        blocker: false
      },
      {
        id: 'automated_tests',
        title: 'Security Tests Passing',
        description: 'Run automated security test suite',
        checked: false,
        blocker: true
      },
      {
        id: 'xss_prevention',
        title: 'XSS Prevention Verified',
        description: 'All user inputs properly escaped',
        checked: false,
        blocker: true
      }
    ],
    tenant: [
      {
        id: 'subdomain_routing',
        title: 'Subdomain Routing (Optional)',
        description: 'TenantRouter configured for subdomain isolation',
        checked: false,
        blocker: false
      },
      {
        id: 'entity_adapter',
        title: 'EntityAdapter Migration Ready',
        description: 'Abstraction layer for future backend',
        checked: true,
        blocker: false
      },
      {
        id: 'leak_detector',
        title: 'Tenant Leak Detector Active',
        description: 'Real-time monitoring for cross-tenant access',
        checked: true,
        blocker: false
      }
    ],
    compliance: [
      {
        id: 'compliance_logger',
        title: 'ComplianceLogger with Crypto-Chain',
        description: 'Immutable audit trail with hash chaining',
        checked: true,
        blocker: true
      },
      {
        id: 'pii_redactor',
        title: 'PII Redaction Active',
        description: 'All logs automatically redact PII',
        checked: true,
        blocker: true
      },
      {
        id: 'consent_tracking',
        title: 'Consent Management Implemented',
        description: 'GDPR-compliant consent tracking',
        checked: true,
        blocker: true
      },
      {
        id: 'crypto_shredding',
        title: 'Crypto-Shredding Documented',
        description: 'GDPR Article 17 implementation plan',
        checked: true,
        blocker: false
      },
      {
        id: 'chain_verification',
        title: 'Audit Chain Verified',
        description: 'No tampering detected in compliance logs',
        checked: false,
        blocker: true
      },
      {
        id: 'data_export',
        title: 'GDPR Data Export Functional',
        description: 'Users can export their data',
        checked: false,
        blocker: true
      }
    ],
    operations: [
      {
        id: 'error_tracking',
        title: 'Error Tracking Configured',
        description: 'Sentry/Rollbar or similar',
        checked: false,
        blocker: false
      },
      {
        id: 'monitoring_dashboard',
        title: 'Monitoring Dashboard',
        description: 'Real-time metrics and alerts',
        checked: false,
        blocker: false
      },
      {
        id: 'backup_strategy',
        title: 'Backup Strategy Defined',
        description: 'Database backup frequency and retention',
        checked: false,
        blocker: true
      },
      {
        id: 'incident_runbook',
        title: 'Incident Response Runbook',
        description: 'Procedures for security incidents',
        checked: false,
        blocker: true
      },
      {
        id: 'rate_limiting',
        title: 'Rate Limiting Configured',
        description: 'Prevent API abuse',
        checked: false,
        blocker: false
      }
    ],
    documentation: [
      {
        id: 'backend_migration_guide',
        title: 'Backend Migration Guide',
        description: 'Documentation for future backend dev',
        checked: true,
        blocker: false
      },
      {
        id: 'security_disclosure',
        title: 'Security Disclosure Policy',
        description: 'How users report vulnerabilities',
        checked: false,
        blocker: false
      },
      {
        id: 'privacy_policy',
        title: 'Privacy Policy Published',
        description: 'GDPR-compliant privacy policy',
        checked: false,
        blocker: true
      },
      {
        id: 'terms_of_service',
        title: 'Terms of Service',
        description: 'Legal terms and liability limits',
        checked: false,
        blocker: true
      },
      {
        id: 'api_docs',
        title: 'API Documentation',
        description: 'For beta users integrating',
        checked: false,
        blocker: false
      }
    ]
  };
}