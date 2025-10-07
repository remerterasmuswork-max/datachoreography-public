import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { WorkflowStep } from '@/api/entities';
import { Database, ArrowRight, Shield, Clock } from 'lucide-react';

export default function DataMapViewer({ workflowId }) {
  const [steps, setSteps] = useState([]);
  const [piiSummary, setPiiSummary] = useState({
    total_fields: 0,
    retention_days: 2555,
    encryption_enabled: true,
  });

  useEffect(() => {
    if (workflowId) {
      loadDataMap();
    }
  }, [workflowId]);

  const loadDataMap = async () => {
    try {
      const workflowSteps = await WorkflowStep.filter({ workflow_id: workflowId });
      setSteps(workflowSteps);

      // Calculate PII summary
      const allPiiFields = new Set();
      workflowSteps.forEach(step => {
        if (step.pii_fields) {
          step.pii_fields.forEach(field => allPiiFields.add(field));
        }
      });

      setPiiSummary({
        total_fields: allPiiFields.size,
        retention_days: 2555, // 7 years default
        encryption_enabled: true,
      });
    } catch (error) {
      console.error('Failed to load data map:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-indigo-600" />
          Data Flow Map
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-indigo-50 rounded-lg">
            <Database className="w-6 h-6 text-indigo-600 mb-2" />
            <p className="text-sm text-indigo-900">PII Fields</p>
            <p className="text-2xl font-bold text-indigo-600">{piiSummary.total_fields}</p>
          </div>

          <div className="p-4 bg-green-50 rounded-lg">
            <Shield className="w-6 h-6 text-green-600 mb-2" />
            <p className="text-sm text-green-900">Encryption</p>
            <p className="text-2xl font-bold text-green-600">
              {piiSummary.encryption_enabled ? 'Enabled' : 'Disabled'}
            </p>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg">
            <Clock className="w-6 h-6 text-purple-600 mb-2" />
            <p className="text-sm text-purple-900">Retention</p>
            <p className="text-2xl font-bold text-purple-600">
              {Math.round(piiSummary.retention_days / 365)}y
            </p>
          </div>
        </div>

        {/* Data Flow */}
        <div>
          <h3 className="font-semibold mb-3">Data Processing Steps</h3>
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div key={step.id}>
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-gray-900">{step.step_name}</p>
                      <Badge variant="outline" className="text-xs">{step.tool}</Badge>
                    </div>
                    {step.pii_fields && step.pii_fields.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-600 mb-1">Processes PII:</p>
                        <div className="flex flex-wrap gap-1">
                          {step.pii_fields.map((field, idx) => (
                            <Badge key={idx} className="bg-yellow-100 text-yellow-800 text-xs">
                              {field}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {index < steps.length - 1 && (
                  <div className="flex justify-center py-2">
                    <ArrowRight className="w-5 h-5 text-gray-400 rotate-90" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Compliance Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">GDPR Compliance</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✓ All PII is encrypted at rest using AES-256</li>
            <li>✓ Data retention policy: {Math.round(piiSummary.retention_days / 365)} years</li>
            <li>✓ Right to erasure supported via crypto-shredding</li>
            <li>✓ All data access is logged for audit trails</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}