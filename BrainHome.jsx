import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Zap,
  Loader,
  ArrowRight,
  Settings
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import TenantEntity from '../components/TenantEntity';
import { RiskForecast, GenomeSuggestion, AgentInstall, Run } from '@/api/entities';

export default function BrainHome() {
  const [loading, setLoading] = useState(true);
  const [forecasts, setForecasts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [skills, setSkills] = useState([]);
  const [stats, setStats] = useState({
    active_workflows: 0,
    runs_today: 0,
    auto_resolved_rate: 0,
    avg_confidence: 0
  });

  useEffect(() => {
    loadBrainData();
  }, []);

  const loadBrainData = async () => {
    try {
      const TenantRiskForecast = TenantEntity.wrap(RiskForecast);
      const TenantGenomeSuggestion = TenantEntity.wrap(GenomeSuggestion);
      const TenantAgentInstall = TenantEntity.wrap(AgentInstall);
      const TenantRun = TenantEntity.wrap(Run);

      // Load active forecasts (not expired)
      const allForecasts = await TenantRiskForecast.list('-forecast_date', 50);
      const activeForecasts = allForecasts.filter(f => {
        if (!f.expires_at) return true;
        return new Date(f.expires_at) > new Date();
      });

      // Load draft suggestions
      const allSuggestions = await TenantGenomeSuggestion.filter({ state: 'draft' }, '-created_date', 10);

      // Load installed skills
      const installedSkills = await TenantAgentInstall.filter({ enabled: true });

      // Calculate stats
      const today = new Date().toISOString().split('T')[0];
      const runs = await TenantRun.list('-started_at', 100);
      const todayRuns = runs.filter(r => r.started_at?.startsWith(today));
      const autoResolved = todayRuns.filter(r => 
        r.status === 'completed' && 
        !r.workflow_id?.includes('manual')
      ).length;

      const avgConfidence = activeForecasts.length > 0
        ? Math.round(activeForecasts.reduce((sum, f) => sum + (f.confidence || 0), 0) / activeForecasts.length)
        : 0;

      setForecasts(activeForecasts);
      setSuggestions(allSuggestions);
      setSkills(installedSkills);
      setStats({
        active_workflows: new Set(runs.map(r => r.workflow_id)).size,
        runs_today: todayRuns.length,
        auto_resolved_rate: todayRuns.length > 0 ? Math.round((autoResolved / todayRuns.length) * 100) : 0,
        avg_confidence: avgConfidence
      });

    } catch (error) {
      console.error('Failed to load brain data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applySuggestion = async (suggestionId) => {
    try {
      const TenantGenomeSuggestion = TenantEntity.wrap(GenomeSuggestion);
      await TenantGenomeSuggestion.update(suggestionId, {
        state: 'applied',
        applied_at: new Date().toISOString()
      });
      loadBrainData();
    } catch (error) {
      alert('Failed to apply suggestion: ' + error.message);
    }
  };

  const dismissSuggestion = async (suggestionId) => {
    try {
      const TenantGenomeSuggestion = TenantEntity.wrap(GenomeSuggestion);
      await TenantGenomeSuggestion.update(suggestionId, { state: 'rejected' });
      loadBrainData();
    } catch (error) {
      alert('Failed to dismiss suggestion: ' + error.message);
    }
  };

  const getRiskColor = (deltaPercent) => {
    if (deltaPercent > 15) return 'text-red-600';
    if (deltaPercent > 5) return 'text-yellow-600';
    if (deltaPercent < -5) return 'text-green-600';
    return 'text-gray-600';
  };

  const getRiskBadge = (deltaPercent) => {
    if (deltaPercent > 15) return <Badge className="bg-red-100 text-red-800">High Risk</Badge>;
    if (deltaPercent > 5) return <Badge className="bg-yellow-100 text-yellow-800">Medium Risk</Badge>;
    return <Badge className="bg-green-100 text-green-800">Low Risk</Badge>;
  };

  const getRiskIcon = (deltaPercent) => {
    if (deltaPercent > 0) return <TrendingUp className="w-5 h-5 text-red-500" />;
    return <TrendingDown className="w-5 h-5 text-green-500" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain className="w-10 h-10 text-indigo-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">AI Brain</h1>
                <p className="text-gray-600">Predictive insights and auto-optimization</p>
              </div>
            </div>
            <Link to={createPageUrl('Settings')}>
              <Button variant="outline" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Configure
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Workflows</p>
                  <p className="text-3xl font-bold text-indigo-600">{stats.active_workflows}</p>
                </div>
                <Zap className="w-8 h-8 text-indigo-200" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Runs Today</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.runs_today}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Auto-Resolved</p>
                  <p className="text-3xl font-bold text-green-600">{stats.auto_resolved_rate}%</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Confidence</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.avg_confidence}%</p>
                </div>
                <Brain className="w-8 h-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="forecasts" className="space-y-6">
          <TabsList>
            <TabsTrigger value="forecasts">Risk Forecasts ({forecasts.length})</TabsTrigger>
            <TabsTrigger value="suggestions">Optimizations ({suggestions.length})</TabsTrigger>
            <TabsTrigger value="skills">Active Skills ({skills.length})</TabsTrigger>
          </TabsList>

          {/* Risk Forecasts Tab */}
          <TabsContent value="forecasts">
            {forecasts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No active risk forecasts</p>
                  <p className="text-sm text-gray-400 mt-2">Run genome analysis to generate forecasts</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {forecasts.map((forecast) => (
                  <Card key={forecast.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {getRiskIcon(forecast.delta_percent)}
                          <div>
                            <CardTitle className="text-lg capitalize">
                              {forecast.risk_type.replace('_', ' ')}
                            </CardTitle>
                            <p className="text-sm text-gray-600">
                              {forecast.horizon_days}-day forecast
                            </p>
                          </div>
                        </div>
                        {getRiskBadge(forecast.delta_percent)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Current</p>
                          <p className="text-2xl font-bold">{forecast.current_value?.toFixed(1)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Forecast</p>
                          <p className={`text-2xl font-bold ${getRiskColor(forecast.delta_percent)}`}>
                            {forecast.forecasted_value?.toFixed(1)}
                            <span className="text-sm ml-2">
                              ({forecast.delta_percent > 0 ? '+' : ''}{forecast.delta_percent?.toFixed(1)}%)
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs font-semibold text-gray-700 mb-2">Confidence: {forecast.confidence}%</p>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-indigo-600 h-2 rounded-full"
                            style={{ width: `${forecast.confidence}%` }}
                          />
                        </div>
                      </div>

                      {forecast.suggested_actions && forecast.suggested_actions.length > 0 && (
                        <div className="border-t pt-4">
                          <p className="text-sm font-semibold mb-2">Suggested Actions:</p>
                          <ul className="space-y-1">
                            {forecast.suggested_actions.slice(0, 3).map((action, idx) => (
                              <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                                <ArrowRight className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                                {action}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <Button size="sm" className="flex-1">
                          View Details
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          Apply Actions
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Optimization Suggestions Tab */}
          <TabsContent value="suggestions">
            {suggestions.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No pending optimizations</p>
                  <Link to={createPageUrl('Optimize')}>
                    <Button className="mt-4">Go to Genome Learning</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {suggestions.map((suggestion) => (
                  <Card key={suggestion.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Zap className="w-5 h-5 text-yellow-500" />
                            <h4 className="font-semibold text-lg capitalize">
                              {suggestion.suggestion_type?.replace('_', ' ')}
                            </h4>
                            <Badge className="bg-indigo-100 text-indigo-800">
                              {suggestion.confidence}% confidence
                            </Badge>
                          </div>

                          <p className="text-gray-700 mb-3">{suggestion.expected_impact}</p>

                          {suggestion.workflow_key && (
                            <p className="text-sm text-gray-600">
                              Target: <span className="font-mono">{suggestion.workflow_key}</span>
                              {suggestion.step_name && ` → ${suggestion.step_name}`}
                            </p>
                          )}

                          {suggestion.payload && (
                            <div className="mt-3 bg-gray-50 rounded-lg p-3">
                              <p className="text-xs font-semibold text-gray-700 mb-2">Configuration:</p>
                              <pre className="text-xs text-gray-600 overflow-x-auto">
                                {JSON.stringify(suggestion.payload, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-2 ml-4">
                          <Button 
                            size="sm"
                            onClick={() => applySuggestion(suggestion.id)}
                            className="whitespace-nowrap"
                          >
                            Apply Now
                          </Button>
                          <Button 
                            size="sm"
                            variant="outline"
                            onClick={() => dismissSuggestion(suggestion.id)}
                          >
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Active Skills Tab */}
          <TabsContent value="skills">
            {skills.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No skills installed</p>
                  <Link to={createPageUrl('AgentSkills')}>
                    <Button className="mt-4">Browse Skills</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {skills.map((install) => (
                  <Card key={install.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{install.skill_id}</CardTitle>
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-600">Version</p>
                          <p className="font-mono text-sm">{install.installed_version}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Executions</p>
                          <p className="text-lg font-bold">{install.execution_count || 0}</p>
                        </div>
                        {install.last_execution && (
                          <div>
                            <p className="text-sm text-gray-600">Last Run</p>
                            <p className="text-sm">{new Date(install.last_execution).toLocaleString()}</p>
                          </div>
                        )}
                        <Link to={createPageUrl(`AgentSkills?skill=${install.skill_id}`)}>
                          <Button size="sm" variant="outline" className="w-full">
                            View Details
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}