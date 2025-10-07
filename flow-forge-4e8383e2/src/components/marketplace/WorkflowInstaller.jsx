import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, X, AlertCircle } from 'lucide-react';
import { Workflow, WorkflowStep, Connection } from '@/api/entities';
import { motion, AnimatePresence } from 'framer-motion';

export default function WorkflowInstaller({ workflow, onClose, onComplete }) {
  const [step, setStep] = useState(0);
  const [connections, setConnections] = useState([]);
  const [selectedConnections, setSelectedConnections] = useState({});
  const [installing, setInstalling] = useState(false);
  const [error, setError] = useState(null);

  const installSteps = [
    'Review Workflow',
    'Connect Services',
    'Configure Settings',
    'Install'
  ];

  React.useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      const conns = await Connection.list();
      setConnections(conns);

      // Pre-select first available connection for each required service
      const preSelected = {};
      workflow.connections.forEach(provider => {
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

  const handleInstall = async () => {
    setInstalling(true);
    setError(null);

    try {
      // Create workflow
      const [newWorkflow] = await Workflow.bulkCreate([{
        workflow_key: workflow.id,
        display_name: workflow.name,
        description: workflow.description,
        version: 1,
        enabled: false, // Start disabled
        simulation_mode: true, // Start in simulation
        trigger_type: workflow.triggers[0].includes('schedule') ? 'schedule' : 'webhook',
        trigger_config: {},
      }]);

      // Create workflow steps (simplified - real implementation would be more detailed)
      const steps = workflow.actions.map((action, index) => ({
        workflow_id: newWorkflow.id,
        step_order: index,
        step_name: action.toLowerCase().replace(/\s+/g, '_'),
        tool: workflow.connections[index % workflow.connections.length],
        action: 'execute',
        connection_id: Object.values(selectedConnections)[index % Object.values(selectedConnections).length],
        mapping_json: {},
        risk_level: 'normal',
      }));

      await WorkflowStep.bulkCreate(steps);

      onComplete();
    } catch (err) {
      setError(err.message);
    } finally {
      setInstalling(false);
    }
  };

  const canProceed = () => {
    if (step === 1) {
      // Check all required connections are selected
      return workflow.connections.every(provider => selectedConnections[provider]);
    }
    return true;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-3xl"
      >
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center gap-3">
                  <span className="text-3xl">{workflow.icon}</span>
                  Install {workflow.name}
                </CardTitle>
                <p className="text-sm text-gray-600 mt-2">{workflow.description}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-between mt-6">
              {installSteps.map((label, index) => (
                <div key={index} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      index < step ? 'bg-green-500' :
                      index === step ? 'bg-indigo-600' :
                      'bg-gray-300'
                    }`}>
                      {index < step ? (
                        <CheckCircle className="w-5 h-5 text-white" />
                      ) : (
                        <span className="text-white text-sm">{index + 1}</span>
                      )}
                    </div>
                    <span className="text-xs mt-2 text-gray-600">{label}</span>
                  </div>
                  {index < installSteps.length - 1 && (
                    <div className={`w-24 h-1 mx-2 ${index < step ? 'bg-green-500' : 'bg-gray-300'}`} />
                  )}
                </div>
              ))}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <AnimatePresence mode="wait">
              {/* Step 0: Review */}
              {step === 0 && (
                <motion.div
                  key="step0"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div>
                    <h3 className="font-semibold mb-3">This workflow will:</h3>
                    <ul className="space-y-2">
                      {workflow.actions.map((action, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-gray-700">{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                    <h4 className="font-semibold text-indigo-900 mb-2">Expected Benefits</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-indigo-700 font-medium">Time Saved:</span>
                        <span className="text-indigo-900 ml-2">{workflow.estimatedTimeSaved}</span>
                      </div>
                      <div>
                        <span className="text-indigo-700 font-medium">Revenue Impact:</span>
                        <span className="text-indigo-900 ml-2">{workflow.revenueImpact}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 1: Connect Services */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div>
                    <h3 className="font-semibold mb-3">Connect Required Services</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Select which account to use for each service:
                    </p>
                  </div>

                  {workflow.connections.map(provider => {
                    const availableConns = connections.filter(c => c.provider === provider);
                    
                    return (
                      <div key={provider} className="border rounded-lg p-4">
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

              {/* Step 2: Configure */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div>
                    <h3 className="font-semibold mb-3">Workflow Settings</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Configure how this workflow behaves:
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <label className="flex items-center gap-3">
                        <input type="checkbox" defaultChecked className="w-4 h-4" />
                        <div>
                          <span className="font-medium">Start in Simulation Mode</span>
                          <p className="text-sm text-gray-600">Test without making real changes</p>
                        </div>
                      </label>
                    </div>

                    <div className="border rounded-lg p-4">
                      <label className="flex items-center gap-3">
                        <input type="checkbox" className="w-4 h-4" />
                        <div>
                          <span className="font-medium">Enable Immediately</span>
                          <p className="text-sm text-gray-600">Start processing triggers right away</p>
                        </div>
                      </label>
                    </div>

                    <div className="border rounded-lg p-4">
                      <label className="flex items-center gap-3">
                        <input type="checkbox" defaultChecked className="w-4 h-4" />
                        <div>
                          <span className="font-medium">Send Notifications</span>
                          <p className="text-sm text-gray-600">Get alerted of failures and important events</p>
                        </div>
                      </label>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Install */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="text-center py-8">
                    {installing ? (
                      <>
                        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
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

            {error && step !== 3 && (
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

              {step < 3 ? (
                <Button
                  onClick={() => setStep(step + 1)}
                  disabled={!canProceed()}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  Continue
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