import React, { useState } from 'react';
import { runWorkflow, processNextStep } from '../components/WorkflowRunner';
import { User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader, Play, SkipForward } from 'lucide-react';

/**
 * WorkflowRunner Page: Manual workflow execution interface
 * This page acts as the "backend processor" triggered by UI
 */
export default function WorkflowRunnerPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [workflowId, setWorkflowId] = useState('');
  const [orderId, setOrderId] = useState('');

  const handleEnqueueRun = async () => {
    setLoading(true);
    try {
      const user = await User.me();
      const response = await runWorkflow({
        tenantId: user.tenant_id,
        workflowId,
        triggerPayload: { order_id: orderId },
        idempotencyKey: `manual_${Date.now()}`,
        userId: user.id
      });
      setResult(response);
    } catch (error) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleProcessNext = async () => {
    if (!result?.runId) return;
    
    setLoading(true);
    try {
      const user = await User.me();
      const response = await processNextStep(result.runId, user.tenant_id);
      setResult({ ...result, ...response });
    } catch (error) {
      setResult({ ...result, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Workflow Runner (Manual Trigger)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Workflow ID</label>
              <Input
                value={workflowId}
                onChange={(e) => setWorkflowId(e.target.value)}
                placeholder="workflow-uuid"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Order ID (trigger payload)</label>
              <Input
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="5678901234"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleEnqueueRun}
                disabled={loading || !workflowId}
                className="flex items-center gap-2"
              >
                {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Enqueue Run
              </Button>

              <Button
                onClick={handleProcessNext}
                disabled={loading || !result?.runId}
                variant="outline"
                className="flex items-center gap-2"
              >
                <SkipForward className="w-4 h-4" />
                Process Next Step
              </Button>
            </div>

            {result && (
              <div className="mt-6 p-4 bg-gray-900 text-gray-100 rounded-lg font-mono text-xs overflow-x-auto">
                <pre>{JSON.stringify(result, null, 2)}</pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}