import React, { useState, useEffect } from 'react';
import { Run, RunLog } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, Activity, Loader } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Runs() {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadRuns();
  }, [filter]);

  const loadRuns = async () => {
    try {
      const filterObj = filter === 'all' ? {} : { status: filter };
      const runsList = await Run.filter(filterObj, '-started_at', 50);
      setRuns(runsList);
    } catch (error) {
      console.error('Failed to load runs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'running':
        return <Activity className="w-5 h-5 text-blue-500 animate-pulse" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
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
          <h1 className="text-3xl font-bold text-gray-900">Workflow Runs</h1>
          <p className="text-gray-600 mt-2">Monitor workflow execution history</p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {['all', 'running', 'completed', 'failed', 'awaiting_approval'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Runs List */}
        {runs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No workflow runs found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {runs.map((run) => (
              <Link key={run.id} to={createPageUrl(`RunDetail?id=${run.id}`)}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {getStatusIcon(run.status)}
                        <div>
                          <p className="font-medium text-gray-900">
                            Run #{run.id.slice(0, 8)}
                          </p>
                          <p className="text-sm text-gray-600">
                            Started: {new Date(run.started_at).toLocaleString()}
                          </p>
                          {run.correlation_id && (
                            <p className="text-xs text-gray-500 font-mono mt-1">
                              {run.correlation_id}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {run.duration_ms && (
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              {(run.duration_ms / 1000).toFixed(2)}s
                            </p>
                            <p className="text-xs text-gray-500">duration</p>
                          </div>
                        )}
                        
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            Step {run.current_step_order + 1}
                          </p>
                          <p className="text-xs text-gray-500">current</p>
                        </div>

                        {getStatusBadge(run.status)}

                        {run.is_simulation && (
                          <Badge className="bg-yellow-100 text-yellow-800">
                            Simulation
                          </Badge>
                        )}
                      </div>
                    </div>

                    {run.error_message && (
                      <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-sm text-red-800">{run.error_message}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}