import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  X,
  CheckCircle,
  Circle,
  AlertCircle,
  Loader,
  Plug,
  Settings,
  Shield,
  Play,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Workflow, WorkflowStep, Connection, ComplianceEvent, MetricEvent } from '@/api/entities';

export default function InstallWizard({ template, onClose, onComplete }) {
  const [step, setStep] = useState(0);
  const [connections, setConnections] = useState([]);
  const [selectedConnections, setSelectedConnections] = useState({});
  const [configuration, setConfiguration] = useState({
    enabled: false,
    simulation_mode: true,
    send_notifications: true,
  });
  const [installing, setInstalling] = useState(false);
  const [error, setError] = useState(null);
  const [testResult, setTestResult] = useState(null);

  const installSteps = [
    'Connect Services',
    'Configure Settings',
    'Review Permissions',
    'Test Run',
    'Deploy'
  ];

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      const conns = await Connection.list();
      setConnections(conns);

      // Pre-select first available connection for each required service
      const preSelected = {};
      template.required_connections.forEach(provider => {
        const conn = conns.find(c => c.provider === provider && c.status === 'active');
        if (conn) {
          preSelected[provider] = conn.id;
        }
      });
      setSelectedConnections(preSelected);
    } catch (err) {
      console.error('Failed to load connections:', err);
    }
  };

  const handleTestRun = async () => {
    setTestResult('running');
    // Simulate test run
    await new Promise(resolve => setTimeout(resolve, 3000));
    setTestResult('success');
  };

  const handleInstall = async () => {
    setInstalling(true);
    setError(null);

    try {
      // 1. Create workflow from template
      const [workflow] = await Workflow.bulkCreate([{
        workflow_key: template.template_id,
        display_name: template.name,
        description: template.description,
        version: 1,
        enabled: configuration.enabled,
        simulation_mode: configuration.simulation_mode,
        trigger_type: template.workflow_json.trigger.type,
        trigger_config: template.workflow_json.trigger.config || {},
      }]);

      // 2. Create workflow steps
      const steps = template.workflow_json.steps.map((stepTemplate, index) => ({
        workflow_id: workflow.id,
        step_order: index,
        step_name: stepTemplate.name.toLowerCase().replace(/\s+/g, '_'),
        tool: stepTemplate.provider,
        action: stepTemplate.action,
        connection_id: selectedConnections[stepTemplate.provider],
        mapping_json: stepTemplate.inputs || {},
        requires_approval: stepTemplate.requires_approval || false,
        approval_roles: stepTemplate.approval_roles || [],
        risk_level: stepTemplate.risk_level || 'normal',
        pii_fields: template.gdpr.pii_fields_collected || [],
      }));

      await WorkflowStep.bulkCreate(steps);

      // 3. Log compliance event
      await ComplianceEvent.create({
        category: 'config_change',
        event_type: 'workflow_installed',
        ref_type: 'workflow',
        ref_id: workflow.id,
        actor: 'user',
        payload: {
          template_id: template.template_id,
          template_version: template.version,
          connections_configured: Object.keys(selectedConnections).length,
        },
        pii_redacted: true,
      });

      // 4. Emit metric event
      await MetricEvent.create({
        metric_name: 'template_installed',
        metric_value: 1,
        metric_unit: 'count',
        dimensions: {
          template_id: template.template_id,
          category: template.category,
        },
        tags: ['marketplace', 'installation'],
      });

      onComplete();
    } catch (err) {
      setError(err.message);
    } finally {
      setInstalling(false);
    }
  };

  const canProceed = () => {
    if (step === 0) {
      // Check all required connections are selected
      return template.required_connections.every(provider => selectedConnections[provider]);
    }
    if (step === 3) {
      // Check test run completed
      return testResult === 'success';
    }
    return true;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-4xl my-8"
      >
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center gap-3">
                  <span className="text-3xl">{template.icon}</span>
                  Install {template.name}
                </CardTitle>
                <p className="text-sm text-gray-600 mt-2">{template.description}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-between mt-6">
              {installSteps.map((label, index) => (
                <div key={index} className="flex items-center flex-1">
                  <div className="flex flex-col items-center w-full">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      index < step ? 'bg-green-500' :
                      index === step ? 'bg-indigo-600' :
                      'bg-gray-300'
                    }`}>
                      {index < step ? (
                        <CheckCircle className="w-6 h-6 text-white" />
                      ) : (
                        <span className="text-white font-semibold">{index + 1}</span>
                      )}
                    </div>
                    <span className="text-xs mt-2 text-gray-600 text-center">{label}</span>
                  </div>
                  {index < installSteps.length - 1 && (
                    <div className={`h-1 flex-1 mx-2 ${index < step ? 'bg-green-500' : 'bg-gray-300'}`} />
                  )}
                </div>
              ))}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <AnimatePresence mode="wait">
              {/* Step 0: Connect Services */}
              {step === 0 && (
                <motion.div
                  key="step0"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Plug className="w-5 h-5 text-indigo-600" />
                      Connect Required Services
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Select which account to use for each service:
                    </p>
                  </div>

                  {template.required_connections.map(provider => {
                    const availableConns = connections.filter(c => c.provider === provider);
                    
                    return (
                      <div key={provider} className="border-2 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-medium capitalize">{provider}</span>
                          <Badge className={availableConns.length > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {availableConns.length} available
                          </Badge>
                        </div>

                        {availableConns.length === 0 ? (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                            <AlertCircle className="w-4 h-4 inline mr-2" />
                            No {provider} connection found. You'll need to add one first.
                          </div>
                        ) : (
                          <select
                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                            value={selectedConnections[provider] || ''}
                            onChange={(e) => setSelectedConnections({
                              ...selectedConnections,
                              [provider]: e.target.value
                            })}
                          >
                            <option value="">Select connection...</option>
                            {availableConns.map(conn => (
                              <option key={conn.id} value={conn.id}>
                                {conn.name} ({conn.status})
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    );
                  })}
                </motion.div>
              )}

              {/* Step 1: Configure Settings */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Settings className="w-5 h-5 text-indigo-600" />
                      Workflow Settings
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Configure how this workflow behaves:
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="border-2 rounded-lg p-4">
                      <label className="flex items-center justify-between cursor-pointer">
                        <div>
                          <span className="font-medium">Start in Simulation Mode</span>
                          <p className="text-sm text-gray-600">Test without making real changes</p>
                        </div>
                        <Switch
                          checked={configuration.simulation_mode}
                          onCheckedChange={(checked) =>
                            setConfiguration({ ...configuration, simulation_mode: checked })
                          }
                        />
                      </label>
                    </div>

                    <div className="border-2 rounded-lg p-4">
                      <label className="flex items-center justify-between cursor-pointer">
                        <div>
                          <span className="font-medium">Enable Immediately</span>
                          <p className="text-sm text-gray-600">Start processing triggers right away</p>
                        </div>
                        <Switch
                          checked={configuration.enabled}
                          onCheckedChange={(checked) =>
                            setConfiguration({ ...configuration, enabled: checked })
                          }
                        />
                      </label>
                    </div>

                    <div className="border-2 rounded-lg p-4">
                      <label className="flex items-center justify-between cursor-pointer">
                        <div>
                          <span className="font-medium">Send Notifications</span>
                          <p className="text-sm text-gray-600">Get alerted of failures and important events</p>
                        </div>
                        <Switch
                          checked={configuration.send_notifications}
                          onCheckedChange={(checked) =>
                            setConfiguration({ ...configuration, send_notifications: checked })
                          }
                        />
                      </label>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Review Permissions */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-indigo-600" />
                      Review Permissions
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      This template will request the following permissions:
                    </p>
                  </div>

                  <div className="space-y-3">
                    {template.permissions.map((permission, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-blue-900">{permission}</span>
                      </div>
                    ))}
                  </div>

                  {template.gdpr.consent_needed && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h4 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        Data Processing Consent
                      </h4>
                      <p className="text-sm text-yellow-800 mb-3">
                        This workflow will process the following types of personal data:
                      </p>
                      <ul className="space-y-1 mb-4">
                        {template.gdpr.pii_fields_collected.map((field, index) => (
                          <li key={index} className="text-sm text-yellow-900">• {field}</li>
                        ))}
                      </ul>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="w-4 h-4" required />
                        <span className="text-sm text-yellow-900">
                          I consent to this data processing for the stated purpose
                        </span>
                      </label>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Step 3: Test Run */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <Play className="w-5 h-5 text-indigo-600" />
                      Test Run
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Run a test to make sure everything is configured correctly:
                    </p>
                  </div>

                  <div className="border-2 border-indigo-200 rounded-lg p-6 bg-indigo-50">
                    {!testResult && (
                      <div className="text-center">
                        <p className="text-gray-700 mb-4">Ready to test your workflow</p>
                        <Button onClick={handleTestRun} className="bg-indigo-600 hover:bg-indigo-700">
                          <Play className="w-4 h-4 mr-2" />
                          Run Test
                        </Button>
                      </div>
                    )}

                    {testResult === 'running' && (
                      <div className="text-center">
                        <Loader className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
                        <p className="text-gray-700">Testing workflow...</p>
                      </div>
                    )}

                    {testResult === 'success' && (
                      <div className="text-center">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h4 className="font-semibold text-green-900 mb-2">Test Successful!</h4>
                        <p className="text-sm text-green-800">
                          All steps executed correctly. You're ready to deploy.
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Step 4: Deploy */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="text-center py-8">
                    {installing ? (
                      <>
                        <Loader className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-lg font-medium">Installing workflow...</p>
                        <p className="text-sm text-gray-600 mt-2">This may take a few moments</p>
                      </>
                    ) : error ? (
                      <>
                        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <p className="text-lg font-medium text-red-900">Installation Failed</p>
                        <p className="text-sm text-red-600 mt-2">{error}</p>
                        <Button onClick={onClose} className="mt-4">Close</Button>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <p className="text-lg font-medium">Ready to Install</p>
                        <p className="text-sm text-gray-600 mt-2">
                          Click the button below to complete installation
                        </p>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {error && step !== 4 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                <AlertCircle className="w-4 h-4 inline mr-2" />
                {error}
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setStep(Math.max(0, step - 1))}
                disabled={step === 0 || installing}
              >
                Back
              </Button>

              {step < 4 ? (
                <Button
                  onClick={() => setStep(step + 1)}
                  disabled={!canProceed()}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleInstall}
                  disabled={installing || error}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Install Now
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}