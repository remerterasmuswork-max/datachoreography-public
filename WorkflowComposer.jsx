import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, Save, Play, ArrowRight, Settings, Trash2, Copy, 
  Zap, CheckCircle, AlertCircle, Database, Mail, Clock
} from 'lucide-react';
import { Workflow, WorkflowStep, Connection } from '@/api/entities';
import { motion, AnimatePresence } from 'framer-motion';
import TriggerBlock from '../components/workflows/TriggerBlock';
import ActionBlock from '../components/workflows/ActionBlock';
import ConnectionPicker from '../components/workflows/ConnectionPicker';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function WorkflowComposer() {
  const navigate = useNavigate();
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [trigger, setTrigger] = useState(null);
  const [steps, setSteps] = useState([]);
  const [connections, setConnections] = useState([]);
  const [saving, setSaving] = useState(false);
  const [showConnectionPicker, setShowConnectionPicker] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(null);

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    const conns = await Connection.filter({ status: 'active' });
    setConnections(conns);
  };

  const availableActions = [
    {
      id: 'shopify_fetch_order',
      name: 'Fetch Order from Shopify',
      provider: 'shopify',
      icon: '🛍️',
      description: 'Get order details',
      inputs: ['order_id'],
      outputs: ['order_data', 'customer', 'line_items']
    },
    {
      id: 'xero_create_invoice',
      name: 'Create Invoice in Xero',
      provider: 'xero',
      icon: '📊',
      description: 'Generate accounting invoice',
      inputs: ['customer', 'line_items', 'reference'],
      outputs: ['invoice_id', 'invoice_number']
    },
    {
      id: 'stripe_capture_payment',
      name: 'Capture Payment in Stripe',
      provider: 'stripe',
      icon: '💳',
      description: 'Process credit card payment',
      inputs: ['payment_intent_id', 'amount'],
      outputs: ['charge_id', 'receipt_url']
    },
    {
      id: 'send_email',
      name: 'Send Email',
      provider: 'email',
      icon: '📧',
      description: 'Send notification email',
      inputs: ['to', 'subject', 'body'],
      outputs: ['message_id']
    },
    {
      id: 'slack_notify',
      name: 'Send Slack Message',
      provider: 'slack',
      icon: '💬',
      description: 'Post to Slack channel',
      inputs: ['channel', 'message'],
      outputs: ['message_ts']
    },
    {
      id: 'condition_check',
      name: 'Conditional Branch',
      provider: 'logic',
      icon: '🔀',
      description: 'Branch based on condition',
      inputs: ['condition'],
      outputs: ['matched']
    },
    {
      id: 'data_transform',
      name: 'Transform Data',
      provider: 'logic',
      icon: '🔄',
      description: 'Map and transform data',
      inputs: ['input_data'],
      outputs: ['output_data']
    },
    {
      id: 'delay',
      name: 'Wait / Delay',
      provider: 'logic',
      icon: '⏰',
      description: 'Pause workflow execution',
      inputs: ['duration_seconds'],
      outputs: []
    }
  ];

  const addStep = (action) => {
    const newStep = {
      id: `step_${Date.now()}`,
      action: action.id,
      actionData: action,
      config: {},
      connectionId: null,
    };
    setSteps([...steps, newStep]);
  };

  const removeStep = (index) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const updateStep = (index, updates) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], ...updates };
    setSteps(newSteps);
  };

  const duplicateStep = (index) => {
    const stepToDuplicate = { ...steps[index], id: `step_${Date.now()}` };
    const newSteps = [...steps];
    newSteps.splice(index + 1, 0, stepToDuplicate);
    setSteps(newSteps);
  };

  const moveStep = (index, direction) => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === steps.length - 1)
    ) {
      return;
    }

    const newSteps = [...steps];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newSteps[index], newSteps[newIndex]] = [newSteps[newIndex], newSteps[index]];
    setSteps(newSteps);
  };

  const handleSave = async () => {
    if (!workflowName) {
      alert('Please enter a workflow name');
      return;
    }

    if (!trigger) {
      alert('Please select a trigger');
      return;
    }

    if (steps.length === 0) {
      alert('Please add at least one action');
      return;
    }

    setSaving(true);
    try {
      // Create workflow
      const workflow = await Workflow.create({
        workflow_key: workflowName.toLowerCase().replace(/\s+/g, '_'),
        display_name: workflowName,
        description: workflowDescription,
        version: 1,
        enabled: false,
        simulation_mode: true,
        trigger_type: trigger.type,
        trigger_config: trigger.config || {},
      });

      // Create workflow steps
      const stepRecords = steps.map((step, index) => ({
        workflow_id: workflow.id,
        step_order: index,
        step_name: step.actionData.name.toLowerCase().replace(/\s+/g, '_'),
        tool: step.actionData.provider,
        action: step.action,
        connection_id: step.connectionId,
        mapping_json: step.config || {},
        risk_level: 'normal',
      }));

      await WorkflowStep.bulkCreate(stepRecords);

      alert('Workflow created successfully!');
      navigate(createPageUrl(`WorkflowDetail?id=${workflow.id}`));
    } catch (error) {
      alert(`Failed to create workflow: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = () => {
    alert('Test run functionality coming soon!');
  };

  const selectConnectionForStep = (stepIndex) => {
    setCurrentStepIndex(stepIndex);
    setShowConnectionPicker(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Zap className="w-8 h-8 text-indigo-600" />
            Workflow Composer
          </h1>
          <p className="text-gray-600 mt-2">Build custom automation workflows visually</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar - Action Palette */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-lg">Available Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
                {availableActions.map((action) => (
                  <motion.button
                    key={action.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => addStep(action)}
                    className="w-full text-left p-3 border-2 border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{action.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{action.name}</p>
                        <p className="text-xs text-gray-600 truncate">{action.description}</p>
                      </div>
                      <Plus className="w-4 h-4 text-gray-400" />
                    </div>
                  </motion.button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Center - Canvas */}
          <div className="lg:col-span-2 space-y-6">
            {/* Workflow Info */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Workflow Name *</label>
                  <Input
                    placeholder="My Awesome Automation"
                    value={workflowName}
                    onChange={(e) => setWorkflowName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <Textarea
                    placeholder="Describe what this workflow does..."
                    value={workflowDescription}
                    onChange={(e) => setWorkflowDescription(e.target.value)}
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Trigger */}
            <Card className="border-2 border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="w-5 h-5 text-green-600" />
                  Trigger
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!trigger ? (
                  <TriggerBlock onSelect={setTrigger} />
                ) : (
                  <div className="bg-white rounded-lg p-4 border-2 border-green-300">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{trigger.name}</p>
                        <p className="text-sm text-gray-600">{trigger.description}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setTrigger(null)}
                      >
                        Change
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Steps */}
            <AnimatePresence>
              {steps.map((step, index) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="relative"
                >
                  {/* Connector Arrow */}
                  <div className="flex justify-center py-2">
                    <ArrowRight className="w-6 h-6 text-gray-400 rotate-90" />
                  </div>

                  <ActionBlock
                    step={step}
                    index={index}
                    connections={connections}
                    onUpdate={(updates) => updateStep(index, updates)}
                    onRemove={() => removeStep(index)}
                    onDuplicate={() => duplicateStep(index)}
                    onMoveUp={() => moveStep(index, 'up')}
                    onMoveDown={() => moveStep(index, 'down')}
                    onSelectConnection={() => selectConnectionForStep(index)}
                    isFirst={index === 0}
                    isLast={index === steps.length - 1}
                  />
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Add Step Hint */}
            {steps.length === 0 && (
              <Card className="border-2 border-dashed border-gray-300">
                <CardContent className="py-12 text-center">
                  <Plus className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    Add actions from the left panel to build your workflow
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex gap-3 sticky bottom-6 bg-white p-4 rounded-lg shadow-lg border">
              <Button
                onClick={handleSave}
                disabled={saving || !workflowName || !trigger || steps.length === 0}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Workflow'}
              </Button>

              <Button
                onClick={handleTest}
                variant="outline"
                disabled={!trigger || steps.length === 0}
              >
                <Play className="w-4 h-4 mr-2" />
                Test Run
              </Button>
            </div>
          </div>
        </div>

        {/* Connection Picker Modal */}
        {showConnectionPicker && currentStepIndex !== null && (
          <ConnectionPicker
            provider={steps[currentStepIndex].actionData.provider}
            connections={connections.filter(
              (c) => c.provider === steps[currentStepIndex].actionData.provider
            )}
            onSelect={(connectionId) => {
              updateStep(currentStepIndex, { connectionId });
              setShowConnectionPicker(false);
              setCurrentStepIndex(null);
            }}
            onClose={() => {
              setShowConnectionPicker(false);
              setCurrentStepIndex(null);
            }}
          />
        )}
      </div>
    </div>
  );
}