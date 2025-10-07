import React, { useState, useEffect } from 'react';
import { Run, RunLog, Tenant } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Clock, CheckCircle, XCircle, Loader } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30');
  const [metrics, setMetrics] = useState({
    time_saved_hours: 0,
    dso_delta: 0,
    success_rate: 0,
    total_runs: 0,
    failed_runs: 0
  });
  const [chartData, setChartData] = useState([]);
  const [topErrors, setTopErrors] = useState([]);

  useEffect(() => {
    loadAnalytics();
  }, [timeframe]);

  const loadAnalytics = async () => {
    try {
      const daysAgo = parseInt(timeframe);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);
      
      // Load all runs
      const runs = await Run.list('-started_at', 1000);
      const recentRuns = runs.filter(r => r.started_at && new Date(r.started_at) >= startDate);
      
      // Calculate metrics
      const completedRuns = recentRuns.filter(r => r.status === 'completed');
      const failedRuns = recentRuns.filter(r => r.status === 'failed');
      
      // Success rate
      const successRate = recentRuns.length > 0
        ? (completedRuns.length / recentRuns.length * 100).toFixed(1)
        : 0;

      // Time saved: assume 15 min per automated workflow
      const timeSaved = (completedRuns.length * 15 / 60).toFixed(1);

      // DSO improvement: calculate from invoice creation to payment
      const dso_delta = 0; // TODO: Calculate from actual invoice/payment data

      setMetrics({
        time_saved_hours: timeSaved,
        dso_delta: dso_delta.toFixed(1),
        success_rate: successRate,
        total_runs: recentRuns.length,
        failed_runs: failedRuns.length
      });

      // Prepare chart data - group by day
      const dailyData = {};
      recentRuns.forEach(run => {
        if (!run.started_at) return;
        const date = run.started_at.split('T')[0];
        if (!dailyData[date]) {
          dailyData[date] = { date, completed: 0, failed: 0, total: 0 };
        }
        dailyData[date].total++;
        if (run.status === 'completed') dailyData[date].completed++;
        if (run.status === 'failed') dailyData[date].failed++;
      });

      const sortedData = Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));
      setChartData(sortedData);

      // Load run logs to find top errors
      const errorLogs = await RunLog.filter({ log_level: 'ERROR' }, '-timestamp', 100);
      const errorCounts = {};
      errorLogs.forEach(log => {
        const msg = log.message?.slice(0, 100) || 'Unknown error';
        errorCounts[msg] = (errorCounts[msg] || 0) + 1;
      });
      
      const topErrs = Object.entries(errorCounts)
        .map(([message, count]) => ({ message, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      setTopErrors(topErrs);

    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
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
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-2">Track your automation ROI and performance</p>
        </div>

        {/* Timeframe Selector */}
        <Tabs value={timeframe} onValueChange={setTimeframe} className="mb-6">
          <TabsList>
            <TabsTrigger value="7">Last 7 Days</TabsTrigger>
            <TabsTrigger value="30">Last 30 Days</TabsTrigger>
            <TabsTrigger value="90">Last 90 Days</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Time Saved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-3xl font-bold text-indigo-600">{metrics.time_saved_hours}</div>
                  <p className="text-sm text-gray-600">hours</p>
                </div>
                <Clock className="w-8 h-8 text-indigo-200" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">DSO Improvement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-3xl font-bold text-green-600">-{Math.abs(metrics.dso_delta)}</div>
                  <p className="text-sm text-gray-600">days</p>
                </div>
                <TrendingDown className="w-8 h-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-3xl font-bold text-blue-600">{metrics.success_rate}%</div>
                  <p className="text-sm text-gray-600">{metrics.total_runs} runs</p>
                </div>
                <CheckCircle className="w-8 h-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Failed Runs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-3xl font-bold text-red-600">{metrics.failed_runs}</div>
                  <p className="text-sm text-gray-600">errors</p>
                </div>
                <XCircle className="w-8 h-8 text-red-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Daily Workflow Executions</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="completed" fill="#10b981" name="Completed" />
                  <Bar dataKey="failed" fill="#ef4444" name="Failed" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Success Rate Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="completed" 
                    stroke="#6366f1" 
                    strokeWidth={2}
                    name="Successful Runs"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Top Errors */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Top 5 Error Messages</CardTitle>
          </CardHeader>
          <CardContent>
            {topErrors.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No errors in selected period 🎉</p>
            ) : (
              <div className="space-y-3">
                {topErrors.map((error, idx) => (
                  <div key={idx} className="flex items-start justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-mono text-red-900">{error.message}</p>
                    </div>
                    <Badge className="bg-red-600 text-white ml-3">
                      {error.count}x
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ROI Calculation */}
        <Card>
          <CardHeader>
            <CardTitle>ROI Calculation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Time saved ({metrics.time_saved_hours} hours × €50/hour)</span>
                <span className="font-bold text-green-600">€{(metrics.time_saved_hours * 50).toFixed(0)}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <span className="text-gray-700">Subscription cost (€299/month)</span>
                <span className="font-bold text-red-600">-€{(299 * (parseInt(timeframe) / 30)).toFixed(0)}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-indigo-50 rounded-lg border-2 border-indigo-200">
                <span className="font-semibold text-gray-900">Net Savings</span>
                <span className="text-2xl font-bold text-indigo-600">
                  €{((metrics.time_saved_hours * 50) - (299 * (parseInt(timeframe) / 30))).toFixed(0)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}