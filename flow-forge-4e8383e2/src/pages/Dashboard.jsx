import React, { useState, useEffect } from 'react';
import { User, Run, Workflow, MetricDaily } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    activeWorkflows: 0,
    todayRuns: 0,
    successRate: 0,
    avgDuration: 0
  });
  const [recentRuns, setRecentRuns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      // Load workflows
      const workflows = await Workflow.filter({ enabled: true });
      
      // Load today's runs
      const today = new Date().toISOString().split('T')[0];
      const runs = await Run.list('-started_at', 50);
      const todayRuns = runs.filter(r => r.started_at?.startsWith(today));

      // Calculate stats
      const successRate = todayRuns.length > 0 
        ? (todayRuns.filter(r => r.status === 'completed').length / todayRuns.length * 100).toFixed(1)
        : 0;

      const completedRuns = todayRuns.filter(r => r.duration_ms);
      const avgDuration = completedRuns.length > 0
        ? Math.round(completedRuns.reduce((sum, r) => sum + r.duration_ms, 0) / completedRuns.length / 1000)
        : 0;

      setStats({
        activeWorkflows: workflows.length,
        todayRuns: todayRuns.length,
        successRate,
        avgDuration
      });

      setRecentRuns(runs.slice(0, 10));
    } catch (error) {
      console.error('Failed to load dashboard:', error);
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
        <Activity className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">DataChoreography</h1>
          <p className="text-gray-600 mt-2">Welcome back, {user?.full_name}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Active Workflows</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-indigo-600">{stats.activeWorkflows}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Runs Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.todayRuns}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.successRate}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Avg Duration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{stats.avgDuration}s</div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Runs */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Workflow Runs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentRuns.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No workflow runs yet. Create and enable a workflow to get started.</p>
              ) : (
                recentRuns.map((run) => (
                  <Link key={run.id} to={createPageUrl(`RunDetails?id=${run.id}`)}>
                    <div className="flex items-center justify-between p-4 bg-white rounded-lg border hover:border-indigo-300 transition-colors">
                      <div className="flex items-center gap-4">
                        {getStatusIcon(run.status)}
                        <div>
                          <p className="font-medium text-gray-900">
                            Run #{run.id.slice(0, 8)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(run.started_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {run.duration_ms && (
                          <span className="text-sm text-gray-600">
                            {(run.duration_ms / 1000).toFixed(1)}s
                          </span>
                        )}
                        {getStatusBadge(run.status)}
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link to={createPageUrl('Workflows')}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <Activity className="w-12 h-12 text-indigo-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Manage Workflows</h3>
                <p className="text-gray-600 text-sm">Create and configure automation workflows</p>
              </CardContent>
            </Card>
          </Link>

          <Link to={createPageUrl('Connections')}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <TrendingUp className="w-12 h-12 text-green-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Connections</h3>
                <p className="text-gray-600 text-sm">Connect to Shopify, Stripe, Xero, and more</p>
              </CardContent>
            </Card>
          </Link>

          <Link to={createPageUrl('Approvals')}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="pt-6">
                <Clock className="w-12 h-12 text-yellow-600 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Pending Approvals</h3>
                <p className="text-gray-600 text-sm">Review and approve workflow steps</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}