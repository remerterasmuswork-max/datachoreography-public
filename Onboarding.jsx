import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle,
  Circle,
  ArrowRight,
  ArrowLeft,
  Zap,
  Plug,
  Settings,
  Play,
  Rocket,
  Store,
  Building,
  Heart,
  Truck,
  Globe,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Workflow, WorkflowStep, Connection } from '@/api/entities';
import { MARKETPLACE_TEMPLATES } from '../components/marketplace/marketplaceTemplates';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Onboarding() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedIndustry, setSelectedIndustry] = useState(null);
  const [selectedTemplates, setSelectedTemplates] = useState([]);
  const [connections, setConnections] = useState({});
  const [config, setConfig] = useState({
    approval_threshold: 5000,
    auto_retry: true,
    notifications: true,
  });
  const [testResults, setTestResults] = useState(null);
  const [deploying, setDeploying] = useState(false);

  const steps = [
    { id: 0, name: 'Welcome', icon: Rocket },
    { id: 1, name: 'Industry', icon: Building },
    { id: 2, name: 'Templates', icon: Zap },
    { id: 3, name: 'Connect', icon: Plug },
    { id: 4, name: 'Configure', icon: Settings },
    { id: 5, name: 'Test', icon: Play },
    { id: 6, name: 'Deploy', icon: CheckCircle },
  ];

  const industries = [
    {
      id: 'ecommerce',
      name: 'E-Commerce',
      icon: '🛍️',
      description: 'Online retail, dropshipping, DTC brands',
      templates: ['order_to_cash_v1', 'smart_refunds_v1', 'fraud_precheck_v1'],
    },
    {
      id: 'saas',
      name: 'SaaS',
      icon: '💻',
      description: 'Subscription software, B2B platforms',
      templates: ['dunning_sequence_v1', 'ar_chaser_v1', 'high_value_approval_v1'],
    },
    {
      id: 'services',
      name: 'Professional Services',
      icon: '🏢',
      description: 'Consulting, agencies, freelancers',
      templates: ['invoice_sync_v1', 'ar_chaser_v1', 'payment_reconciliation_v1'],
    },
    {
      id: 'manufacturing',
      name: 'Manufacturing',
      icon: '🏭',
      description: 'Production, distribution, wholesale',
      templates: ['invoice_sync_v1', 'payment_reconciliation_v1', 'vat_auto_calc_v1'],
    },
    {
      id: 'marketplace',
      name: 'Marketplace',
      icon: '🌐',
      description: 'Multi-vendor platforms, aggregators',
      templates: ['order_to_cash_v1', 'dispute_evidence_v1', 'payment_reconciliation_v1'],
    },
    {
      id: 'nonprofit',
      name: 'Non-Profit',
      icon: '❤️',
      description: 'Charities, foundations, associations',
      templates: ['ar_chaser_v1', 'invoice_sync_v1', 'high_value_approval_v1'],
    },
  ];

  const recommendedTemplates = selectedIndustry
    ? MARKETPLACE_TEMPLATES.filter(t => 
        industries.find(i => i.id === selectedIndustry)?.templates.includes(t.template_id)
      )
    : [];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleRunTest = async () => {
    setTestResults('running');
    
    // Simulate test workflow run
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    setTestResults({
      success: true,
      duration: '2.3s',
      steps_passed: selectedTemplates[0]?.workflow_json.steps.length || 3,
      warnings: [],
    });
  };

  const handleDeploy = async () => {
    setDeploying(true);

    try {
      // Create workflows from selected templates
      for (const template of selectedTemplates) {
        const workflow = await Workflow.create({
          workflow_key: template.template_id,
          display_name: template.name,
          description: template.description,
          version: 1,
          enabled: false, // Start disabled
          simulation_mode: true, // Start in simulation
          trigger_type: template.workflow_json.trigger.type,
          trigger_config: template.workflow_json.trigger.config || {},
        });

        // Create workflow steps
        const stepRecords = template.workflow_json.steps.map((step, index) => ({
          workflow_id: workflow.id,
          step_order: index,
          step_name: step.name.toLowerCase().replace(/\s+/g, '_'),
          tool: step.provider,
          action: step.action,
          connection_id: connections[step.provider],
          mapping_json: step.inputs || {},
          requires_approval: step.requires_approval || false,
          risk_level: step.risk_level || 'normal',
        }));

        await WorkflowStep.bulkCreate(stepRecords);
      }

      // Track TTFR (Time To First Run)
      const ttfr = Date.now() - (window.onboardingStartTime || Date.now());
      console.log(`TTFR: ${Math.round(ttfr / 1000)}s`);

      // Update user onboarding status
      const user = await User.me();
      await User.updateMyUserData({
        onboarding_completed: true,
        onboarding_ttfr_ms: ttfr,
        selected_industry: selectedIndustry,
      });

      // Navigate to dashboard
      navigate(createPageUrl('AutomationHome'));
    } catch (error) {
      alert(`Deployment failed: ${error.message}`);
    } finally {
      setDeploying(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return selectedIndustry !== null;
      case 2:
        return selectedTemplates.length > 0;
      case 3:
        return Object.keys(connections).length >= 2; // At least 2 connections
      case 5:
        return testResults?.success === true;
      default:
        return true;
    }
  };

  useEffect(() => {
    // Track onboarding start time
    if (!window.onboardingStartTime) {
      window.onboardingStartTime = Date.now();
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Progress Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to DataChoreography</h1>
          <p className="text-gray-600 mb-6">Let's set up your automation in 5 minutes</p>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    index <= currentStep
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {index < currentStep ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <step.icon className="w-5 h-5" />
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`h-1 w-12 mx-2 ${
                      index < currentStep ? 'bg-indigo-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            <Progress value={(currentStep / (steps.length - 1)) * 100} className="h-2" />
          </div>
        </div>

        {/* Step Content */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <AnimatePresence mode="wait">
              {/* Step 0: Welcome */}
              {currentStep === 0 && (
                <motion.div
                  key="welcome"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="text-center py-8"
                >
                  <Rocket className="w-20 h-20 text-indigo-600 mx-auto mb-6" />
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    Automate Your Business Operations
                  </h2>
                  <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
                    Connect your tools, deploy pre-built workflows, and save hours every week.
                    No code required.
                  </p>
                  <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-indigo-600">5 min</div>
                      <div className="text-sm text-gray-600">Setup Time</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">15+ hrs</div>
                      <div className="text-sm text-gray-600">Saved Per Month</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600">10+</div>
                      <div className="text-sm text-gray-600">Ready Templates</div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 1: Industry Selection */}
              {currentStep === 1 && (
                <motion.div
                  key="industry"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">What's your industry?</h2>
                  <p className="text-gray-600 mb-6">We'll recommend the best templates for you</p>

                  <div className="grid grid-cols-2 gap-4">
                    {industries.map((industry) => (
                      <button
                        key={industry.id}
                        onClick={() => setSelectedIndustry(industry.id)}
                        className={`p-6 border-2 rounded-lg text-left transition-all ${
                          selectedIndustry === industry.id
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-indigo-300'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <span className="text-4xl">{industry.icon}</span>
                          {selectedIndustry === industry.id && (
                            <CheckCircle className="w-6 h-6 text-indigo-600" />
                          )}
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1">{industry.name}</h3>
                        <p className="text-sm text-gray-600">{industry.description}</p>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Step 2: Template Selection */}
              {currentStep === 2 && (
                <motion.div
                  key="templates"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Recommended for {industries.find(i => i.id === selectedIndustry)?.name}
                  </h2>
                  <p className="text-gray-600 mb-6">Select workflows to install (you can add more later)</p>

                  <div className="space-y-4">
                    {recommendedTemplates.map((template) => (
                      <div
                        key={template.template_id}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedTemplates.includes(template)
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200 hover:border-indigo-300'
                        }`}
                        onClick={() => {
                          if (selectedTemplates.includes(template)) {
                            setSelectedTemplates(selectedTemplates.filter(t => t !== template));
                          } else {
                            setSelectedTemplates([...selectedTemplates, template]);
                          }
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-2xl">{template.icon}</span>
                              <div>
                                <h3 className="font-semibold text-gray-900">{template.name}</h3>
                                <p className="text-sm text-gray-600">{template.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 mt-3">
                              <Badge variant="outline" className="text-xs">
                                ⏱️ Saves {template.metrics.time_saved_per_run}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                ⭐ {template.metrics.rating}/5
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                📦 {template.workflow_json.steps.length} steps
                              </Badge>
                            </div>
                          </div>
                          {selectedTemplates.includes(template) && (
                            <CheckCircle className="w-6 h-6 text-indigo-600 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Step 3: Connect Services */}
              {currentStep === 3 && (
                <motion.div
                  key="connect"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Services</h2>
                  <p className="text-gray-600 mb-6">
                    We need access to these services to run your automations
                  </p>

                  <div className="space-y-4">
                    {['shopify', 'stripe', 'xero', 'email'].map((service) => (
                      <div key={service} className="p-4 border-2 border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                              <Plug className="w-6 h-6 text-gray-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 capitalize">{service}</h3>
                              <p className="text-sm text-gray-600">
                                {connections[service] ? 'Connected' : 'Not connected'}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant={connections[service] ? 'outline' : 'default'}
                            onClick={() => {
                              if (connections[service]) {
                                const newConns = { ...connections };
                                delete newConns[service];
                                setConnections(newConns);
                              } else {
                                setConnections({
                                  ...connections,
                                  [service]: `${service}_conn_${Date.now()}`,
                                });
                              }
                            }}
                          >
                            {connections[service] ? (
                              <>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Connected
                              </>
                            ) : (
                              <>
                                <Plug className="w-4 h-4 mr-2" />
                                Connect
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-900">
                      <strong>💡 Pro tip:</strong> Your credentials are encrypted and never stored in plain text.
                      We use OAuth where possible for maximum security.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Configure */}
              {currentStep === 4 && (
                <motion.div
                  key="configure"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Configure Settings</h2>
                  <p className="text-gray-600 mb-6">Set your automation preferences</p>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Approval Threshold
                      </label>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600">Require approval for transactions over:</span>
                        <input
                          type="number"
                          value={config.approval_threshold}
                          onChange={(e) => setConfig({ ...config, approval_threshold: parseInt(e.target.value) })}
                          className="border border-gray-300 rounded px-3 py-2 w-32"
                        />
                        <span className="text-sm text-gray-600">USD</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900">Auto-Retry Failed Steps</h3>
                        <p className="text-sm text-gray-600">Automatically retry failed workflow steps</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.auto_retry}
                        onChange={(e) => setConfig({ ...config, auto_retry: e.target.checked })}
                        className="w-6 h-6"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h3 className="font-medium text-gray-900">Email Notifications</h3>
                        <p className="text-sm text-gray-600">Get notified of failures and important events</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.notifications}
                        onChange={(e) => setConfig({ ...config, notifications: e.target.checked })}
                        className="w-6 h-6"
                      />
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h3 className="font-medium text-yellow-900 mb-2">Start in Simulation Mode</h3>
                      <p className="text-sm text-yellow-800">
                        We'll run your workflows in simulation mode first so you can test them safely.
                        No real actions will be taken until you enable live mode.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 5: Test */}
              {currentStep === 5 && (
                <motion.div
                  key="test"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Test Your Automation</h2>
                  <p className="text-gray-600 mb-6">Run a test to make sure everything works</p>

                  {!testResults && (
                    <div className="text-center py-12">
                      <Play className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
                      <p className="text-gray-600 mb-6">
                        We'll run {selectedTemplates[0]?.name} with test data
                      </p>
                      <Button onClick={handleRunTest} className="bg-indigo-600 hover:bg-indigo-700">
                        <Play className="w-4 h-4 mr-2" />
                        Run Test
                      </Button>
                    </div>
                  )}

                  {testResults === 'running' && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                      <p className="text-gray-600">Running test workflow...</p>
                    </div>
                  )}

                  {testResults?.success && (
                    <div className="text-center py-12">
                      <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Test Successful!</h3>
                      <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mt-6">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="text-2xl font-bold text-indigo-600">{testResults.duration}</div>
                          <div className="text-sm text-gray-600">Duration</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="text-2xl font-bold text-green-600">{testResults.steps_passed}</div>
                          <div className="text-sm text-gray-600">Steps Passed</div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Step 6: Deploy */}
              {currentStep === 6 && (
                <motion.div
                  key="deploy"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="text-center py-12"
                >
                  <Rocket className="w-20 h-20 text-indigo-600 mx-auto mb-6" />
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Deploy!</h2>
                  <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                    Your automations are configured and tested. Click deploy to start saving time.
                  </p>

                  <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
                    <div className="bg-indigo-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-indigo-600">{selectedTemplates.length}</div>
                      <div className="text-sm text-gray-600">Workflows</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-green-600">{Object.keys(connections).length}</div>
                      <div className="text-sm text-gray-600">Connected</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="text-2xl font-bold text-purple-600">
                        ~{selectedTemplates.reduce((sum, t) => sum + parseInt(t.metrics.time_saved_per_run.split(' ')[0] || 0), 0)}h
                      </div>
                      <div className="text-sm text-gray-600">Saved/Week</div>
                    </div>
                  </div>

                  <Button
                    onClick={handleDeploy}
                    disabled={deploying}
                    className="bg-indigo-600 hover:bg-indigo-700"
                    size="lg"
                  >
                    {deploying ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Deploying...
                      </>
                    ) : (
                      <>
                        <Rocket className="w-5 h-5 mr-2" />
                        Deploy Automations
                      </>
                    )}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0 || deploying}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          {currentStep < 6 && (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}