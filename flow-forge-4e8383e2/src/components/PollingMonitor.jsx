/**
 * PollingMonitor: Debug UI for workflow polling health
 * Shows polling status, error rate, backoff state
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import useWorkflowPoller from './useWorkflowPoller';

export default function PollingMonitor({ enabled = true }) {
  const {
    pendingRuns,
    isPolling,
    error,
    errorCount,
    backoffMultiplier,
    pollingInterval,
    refresh,
    resetErrors
  } = useWorkflowPoller(null, enabled);

  const isHealthy = errorCount === 0;
  const isWarning = errorCount > 0 && errorCount < 3;
  const isCritical = errorCount >= 3;

  return (
    <Card className="border-2 border-dashed">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Polling Status</CardTitle>
          {isHealthy && <CheckCircle className="w-4 h-4 text-green-500" />}
          {isWarning && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
          {isCritical && <AlertTriangle className="w-4 h-4 text-red-500" />}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-gray-600">Status</p>
            <p className="font-semibold">
              {isPolling ? (
                <Badge className="bg-blue-100 text-blue-800">
                  <Activity className="w-3 h-3 mr-1 inline" />
                  Polling
                </Badge>
              ) : (
                <Badge className="bg-gray-100 text-gray-800">Idle</Badge>
              )}
            </p>
          </div>

          <div>
            <p className="text-gray-600">Pending Runs</p>
            <p className="font-semibold text-lg">{pendingRuns.length}</p>
          </div>

          <div>
            <p className="text-gray-600">Interval</p>
            <p className="font-semibold">
              {pollingInterval / 1000}s
              {backoffMultiplier > 1 && (
                <span className="text-yellow-600"> (×{backoffMultiplier})</span>
              )}
            </p>
          </div>

          <div>
            <p className="text-gray-600">Errors</p>
            <p className={`font-semibold ${
              errorCount === 0 ? 'text-green-600' :
              errorCount < 3 ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {errorCount}
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-2 text-xs text-red-800">
            <p className="font-semibold">Last Error:</p>
            <p className="mt-1">{error}</p>
          </div>
        )}

        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={refresh} className="flex-1">
            <RefreshCw className="w-3 h-3 mr-1" />
            Refresh
          </Button>
          {errorCount > 0 && (
            <Button size="sm" onClick={resetErrors} className="flex-1">
              Reset Errors
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}