import React, { useState, useEffect } from 'react';
import { Workflow, WorkflowStep } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Play, Settings, Eye, EyeOff, Loader } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Workflows() {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      const wfs = await Workflow.list();
      setWorkflows(wfs);
    } catch (error) {
      console.error('Failed to load workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleEnabled = async (workflowId, currentValue) => {
    await Workflow.update(workflowId, { enabled: !currentValue });
    loadWorkflows();
  };

  const toggleSimulation = async (workflowId, currentValue) => {
    await Workflow.update(workflowId, { simulation_mode: !currentValue });
    loadWorkflows();
  };

  const getWorkflowIcon = (key) => {
    const icons = {
      'o2c': '💰',
      'return_refund': '↩️',
      'smart_dunning': '⏰'
    };
    return icons[key] || '⚙️';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Workflows</h1>
          <p className="text-gray-600 mt-2">Manage and monitor your automation workflows</p>
        </div>

        {workflows.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500 mb-4">No workflows configured yet.</p>
              <Link to={createPageUrl('Setup')}>
                <Button>Create Sample Workflows</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {workflows.map((workflow) => (
              <Card key={workflow.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-4xl">{getWorkflowIcon(workflow.workflow_key)}</span>
                      <div>
                        <CardTitle className="text-xl">{workflow.display_name}</CardTitle>
                        <p className="text-sm text-gray-600 mt-1">{workflow.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {workflow.enabled ? (
                        <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-800">Disabled</Badge>
                      )}
                      {workflow.simulation_mode && (
                        <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          Simulation
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Enable Workflow</p>
                      <p className="text-xs text-gray-600">Allow this workflow to process triggers</p>
                    </div>
                    <Switch
                      checked={workflow.enabled}
                      onCheckedChange={() => toggleEnabled(workflow.id, workflow.enabled)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Simulation Mode</p>
                      <p className="text-xs text-gray-600">Log actions without executing them</p>
                    </div>
                    <Switch
                      checked={workflow.simulation_mode}
                      onCheckedChange={() => toggleSimulation(workflow.id, workflow.simulation_mode)}
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Link to={createPageUrl(`WorkflowDetail?id=${workflow.id}`)}>
                      <Button variant="outline" className="flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Configure Steps
                      </Button>
                    </Link>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Play className="w-4 h-4" />
                      Test Run
                    </Button>
                  </div>

                  <div className="border-t pt-4">
                    <p className="text-xs text-gray-500">
                      Trigger: {workflow.trigger_type} • Version: {workflow.version}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}