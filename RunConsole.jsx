import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Pause,
  Play,
  Loader,
  ExternalLink,
  Shield,
  FileText
} from 'lucide-react';
import TenantEntity from '../components/TenantEntity';
import { Run, RunLog, Approval, ComplianceEvent, Artifact } from '@/api/entities';

export default function RunConsole() {
  const [searchParams] = useSearchParams();
  const runId = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [run, setRun] = useState(null);
  const [logs, setLogs] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [complianceEvents, setComplianceEvents] = useState([]);
  const [artifacts, setArtifacts] = useState([]);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (runId) {
      loadRunData();
    }
  }, [runId]);

  const loadRunData = async () => {
    try {
      const TenantRun = TenantEntity.wrap(Run);
      const TenantRunLog = TenantEntity.wrap(RunLog);
      const TenantApproval = TenantEntity.wrap(Approval);
      const TenantComplianceEvent = TenantEntity.wrap(ComplianceEvent);
      const TenantArtifact = TenantEntity.wrap(Artifact);

      const runData = await TenantRun.get(runId);
      const logsData = await TenantRunLog.filter({ run_id: runId }, 'timestamp');
      const approvalsData = await TenantApproval.filter({ run_id: runId });
      const complianceData = await TenantComplianceEvent.filter({ ref_id: runId });
      const artifactsData = await TenantArtifact.filter({ run_id: runId });

      setRun(runData);
      setLogs(logsData);
      setApprovals(approvalsData);
      setComplianceEvents(complianceData);
      setArtifacts(artifactsData);

    } catch (error) {
      console.error('Failed to load run data:', error);
      alert('Failed to load run: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const addNote = async () => {
    if (!note.trim()) return;

    try {
      const TenantRunLog = TenantEntity.wrap(RunLog);
      await TenantRunLog.create({
        run_id: runId,
        log_level: 'INFO',
        message: `Manual note: ${note}`,
        timestamp: new Date().toISOString()
      });

      setNote('');
      loadRunData();
    } catch (error) {
      alert('Failed to add note: ' + error.message);
    }
  };

  const getStatusIcon = (status) => {
    const icons = {
      completed: <CheckCircle className="w-5 h-5 text-green-500" />,
      failed: <XCircle className="w-5 h-5 text-red-500" />,
      running: <Loader className="w-5 h-5 text-blue-500 animate-spin" />,
      awaiting_approval: <Pause className="w-5 h-5 text-yellow-500" />,
      cancelled: <XCircle className="w-5 h-5 text-gray-500" />
    };
    return icons[status] || <Clock className="w-5 h-5 text-gray-400" />;
  };

  const getStatusBadge = (status) => {
    const variants = {
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      running: 'bg-blue-100 text-blue-800',
      awaiting_approval: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return <Badge className={variants[status] || ''}>{status}</Badge>;
  };

  const getLogIcon = (level) => {
    const icons = {
      INFO: <CheckCircle className="w-4 h-4 text-blue-500" />,
      WARN: <AlertTriangle className="w-4 h-4 text-yellow-500" />,
      ERROR: <XCircle className="w-4 h-4 text-red-500" />
    };
    return icons[level] || <FileText className="w-4 h-4 text-gray-400" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!run) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Run not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Run #{run.id.slice(0, 8)}
              </h1>
              <p className="text-gray-600 mt-1">
                Started: {new Date(run.started_at).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {run.is_simulation && (
                <Badge className="bg-yellow-100 text-yellow-800">Simulation Mode</Badge>
              )}
              {getStatusBadge(run.status)}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <p className="text-sm text-gray-600">Duration</p>
                <p className="text-2xl font-bold">
                  {run.duration_ms ? `${(run.duration_ms / 1000).toFixed(2)}s` : 'Running...'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <p className="text-sm text-gray-600">Current Step</p>
                <p className="text-2xl font-bold">{run.current_step_order + 1}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <p className="text-sm text-gray-600">API Calls</p>
                <p className="text-2xl font-bold">{run.actions_count || 0}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <p className="text-sm text-gray-600">Risk Score</p>
                <p className={`text-2xl font-bold ${
                  run.risk_score > 70 ? 'text-red-600' :
                  run.risk_score > 40 ? 'text-yellow-600' :
                  'text-green-600'
                }`}>
                  {run.risk_score || 0}/100
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Timeline (Left Column - 2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Timeline Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="w-5 h-5" />
                  Execution Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                {logs.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No logs yet</p>
                ) : (
                  <div className="space-y-3">
                    {logs.map((log, idx) => (
                      <div key={log.id} className="flex items-start gap-3 pb-3 border-b last:border-b-0">
                        <div className="flex-shrink-0 mt-1">
                          {getLogIcon(log.log_level)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <p className="text-sm font-medium text-gray-900">{log.message}</p>
                            <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          {log.payload_json && Object.keys(log.payload_json).length > 0 && (
                            <details className="mt-2">
                              <summary className="text-xs text-indigo-600 cursor-pointer">
                                View payload
                              </summary>
                              <pre className="text-xs text-gray-600 mt-2 bg-gray-50 p-2 rounded overflow-x-auto">
                                {JSON.stringify(log.payload_json, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Error Details */}
            {run.error_message && (
              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-700">
                    <XCircle className="w-5 h-5" />
                    Error Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-red-50 rounded-lg p-4">
                    <p className="text-sm text-red-800 font-mono">{run.error_message}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Context Data */}
            {run.context && Object.keys(run.context).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Execution Context</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs text-gray-700 bg-gray-50 p-4 rounded overflow-x-auto max-h-96">
                    {JSON.stringify(run.context, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Sidebar (1/3 width) */}
          <div className="space-y-6">
            {/* Guardrails */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Guardrails
                </CardTitle>
              </CardHeader>
              <CardContent>
                {run.guardrail_blocks && run.guardrail_blocks.length > 0 ? (
                  <div className="space-y-2">
                    {run.guardrail_blocks.map((block, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm">
                        <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                        <span>{block}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-green-600 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    All guardrails passed
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Approvals */}
            {approvals.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Pause className="w-5 h-5" />
                    Approvals ({approvals.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {approvals.map((approval) => (
                      <div key={approval.id} className="border-b pb-3 last:border-b-0 last:pb-0">
                        <div className="flex items-center justify-between mb-1">
                          <Badge className={
                            approval.state === 'approved' ? 'bg-green-100 text-green-800' :
                            approval.state === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }>
                            {approval.state}
                          </Badge>
                          {approval.amount_value && (
                            <span className="text-sm font-medium">€{approval.amount_value}</span>
                          )}
                        </div>
                        {approval.comment && (
                          <p className="text-xs text-gray-600 mt-1">{approval.comment}</p>
                        )}
                        {approval.responded_at && (
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(approval.responded_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Artifacts */}
            {artifacts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Artifacts ({artifacts.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {artifacts.map((artifact) => (
                      <a
                        key={artifact.id}
                        href={artifact.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium">{artifact.file_name}</p>
                            <p className="text-xs text-gray-500 capitalize">
                              {artifact.artifact_type?.replace('_', ' ')}
                            </p>
                          </div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Compliance Events */}
            {complianceEvents.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Compliance Events
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {complianceEvents.map((event) => (
                      <div key={event.id} className="text-xs">
                        <p className="font-medium capitalize">
                          {event.event_type?.replace('_', ' ')}
                        </p>
                        <p className="text-gray-500 font-mono text-[10px]">
                          {event.digest_sha256?.slice(0, 16)}...
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Add Note */}
            <Card>
              <CardHeader>
                <CardTitle>Add Note</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add manual note to run timeline..."
                  rows={3}
                />
                <Button onClick={addNote} className="w-full" disabled={!note.trim()}>
                  Add Note
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}