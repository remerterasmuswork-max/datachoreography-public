import React, { useState, useEffect } from 'react';
import { User, Run, Workflow } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, Zap, Clock, DollarSign, CheckCircle, AlertCircle, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import BusinessMetricCard from '../components/automation/BusinessMetricCard';
import { motion } from 'framer-motion';

export default function AutomationHome() {
  const [user, setUser] = useState(null);
  const [metrics, setMetrics] = useState({
    activeWorkflows: 0,
    tasksAutomated: 0,
    hoursSaved: 0,
    revenueProcessed: 0,
    successRate: 0,
    avgExecutionTime: 0
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
      
      // Load recent runs (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const runs = await Run.list('-started_at', 500);
      const recentRunsData = runs.filter(r => 
        r.started_at && new Date(r.started_at) >= thirtyDaysAgo
      );

      // Calculate business metrics
      const completedRuns = recentRunsData.filter(r => r.status === 'completed');
      const successRate = recentRunsData.length > 0
        ? (completedRuns.length / recentRunsData.length * 100).toFixed(1)
        : 0;

      // Estimate time saved (15 min per automated task)
      const hoursSaved = Math.round(completedRuns.length * 15 / 60);

      // Estimate revenue processed (mock calculation)
      const revenueProcessed = completedRuns.reduce((sum, run) => {
        // Extract amount from context if available
        const amount = run.context?.order?.total_amount || 
                      run.context?.invoice?.total_amount || 0;
        return sum + parseFloat(amount);
      }, 0);

      // Average execution time
      const avgTime = completedRuns.length > 0
        ? completedRuns.reduce((sum, r) => sum + (r.duration_ms || 0), 0) / completedRuns.length / 1000
        : 0;

      setMetrics({
        activeWorkflows: workflows.length,
        tasksAutomated: completedRuns.length,
        hoursSaved,
        revenueProcessed: Math.round(revenueProcessed),
        successRate: parseFloat(successRate),
        avgExecutionTime: avgTime.toFixed(1)
      });

      setRecentRuns(runs.slice(0, 5));
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Zap className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.full_name?.split(' ')[0]}</h1>
          <p className="text-gray-600 mt-2">Your automation command center</p>
        </div>

        {/* Business Value Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <BusinessMetricCard
            icon={Zap}
            label="Tasks Automated"
            value={metrics.tasksAutomated}
            subtitle="Last 30 days"
            color="indigo"
            trend="+12%"
          />
          
          <BusinessMetricCard
            icon={Clock}
            label="Hours Saved"
            value={metrics.hoursSaved}
            subtitle="Estimated time"
            color="green"
            trend="+8%"
          />
          
          <BusinessMetricCard
            icon={DollarSign}
            label="Revenue Processed"
            value={`$${metrics.revenueProcessed.toLocaleString()}`}
            subtitle="Through automations"
            color="purple"
          />
          
          <BusinessMetricCard
            icon={TrendingUp}
            label="Success Rate"
            value={`${metrics.successRate}%`}
            subtitle={`${metrics.avgExecutionTime}s avg time`}
            color="blue"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link to={createPageUrl('WorkflowComposer')}>
              <Card className="hover:shadow-xl transition-all cursor-pointer border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-white">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center">
                      <Plus className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Create Workflow</h3>
                      <p className="text-sm text-gray-600">Build custom automation</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link to={createPageUrl('WorkflowLibrary')}>
              <Card className="hover:shadow-xl transition-all cursor-pointer border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                      <Zap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Browse Library</h3>
                      <p className="text-sm text-gray-600">Install prebuilt automations</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link to={createPageUrl('ActionCenter')}>
              <Card className="hover:shadow-xl transition-all cursor-pointer border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-white">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">Action Center</h3>
                      <p className="text-sm text-gray-600">Review pending items</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        </div>

        {/* Active Workflows */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Recent Executions</span>
                <Link to={createPageUrl('Runs')}>
                  <Button variant="ghost" size="sm">View All</Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentRuns.length === 0 ? (
                <div className="text-center py-8">
                  <Zap className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No workflow executions yet</p>
                  <Link to={createPageUrl('WorkflowLibrary')}>
                    <Button className="mt-4">Get Started</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentRuns.map((run) => (
                    <Link key={run.id} to={createPageUrl(`RunDetail?id=${run.id}`)}>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3">
                          {run.status === 'completed' ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : run.status === 'failed' ? (
                            <AlertCircle className="w-5 h-5 text-red-500" />
                          ) : (
                            <Clock className="w-5 h-5 text-yellow-500" />
                          )}
                          <div>
                            <p className="font-medium text-sm">Run #{run.id.slice(0, 8)}</p>
                            <p className="text-xs text-gray-600">
                              {new Date(run.started_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <Badge className={
                          run.status === 'completed' ? 'bg-green-100 text-green-800' :
                          run.status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }>
                          {run.status}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-indigo-50 rounded-lg">
                <h4 className="font-semibold text-indigo-900 mb-2">💡 Start with Templates</h4>
                <p className="text-sm text-indigo-800">
                  Browse our workflow library to install pre-built automations. They're ready to use in minutes!
                </p>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">🔗 Connect Your Tools</h4>
                <p className="text-sm text-green-800">
                  Add your Shopify, Stripe, and Xero accounts to unlock powerful cross-platform automations.
                </p>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg">
                <h4 className="font-semibold text-purple-900 mb-2">📊 Track Your ROI</h4>
                <p className="text-sm text-purple-800">
                  Check the Insights page to see how much time and money your automations are saving.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}