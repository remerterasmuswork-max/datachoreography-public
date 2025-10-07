import React, { useState, useEffect } from 'react';
import { GenomeSuggestion, GenomeObservation, Tenant, WorkflowStep } from '@/api/entities';
import TenantEntity from '../components/TenantEntity';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, AlertCircle, CheckCircle, Clock, Zap, Loader, Sparkles } from 'lucide-react';
import { checkPlanLimit } from '../components/PlanEnforcement';
import { InvokeLLM } from '@/api/integrations';

export default function Optimize() {
  const [suggestions, setSuggestions] = useState([]);
  const [observations, setObservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [tenant, setTenant] = useState(null);
  const [stats, setStats] = useState({
    observations_30d: 0,
    draft_count: 0,
    applied_count: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const TenantSuggestion = TenantEntity.wrap(GenomeSuggestion);
      const TenantObservation = TenantEntity.wrap(GenomeObservation);
      const tenants = await Tenant.list();
      
      setTenant(tenants[0]);
      
      const suggs = await TenantSuggestion.list('-created_date', 50);
      setSuggestions(suggs);
      
      const obs = await TenantObservation.list('-ts', 100);
      setObservations(obs);

      // Calculate stats
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const recentObs = obs.filter(o => o.ts >= thirtyDaysAgo);
      
      setStats({
        observations_30d: recentObs.length,
        draft_count: suggs.filter(s => s.state === 'draft').length,
        applied_count: suggs.filter(s => s.state === 'applied' && s.applied_at >= thirtyDaysAgo).length
      });
      
    } catch (error) {
      console.error('Failed to load genome data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSuggestions = async () => {
    setGenerating(true);
    try {
      // Group observations by workflow and step
      const stepStats = {};
      observations.forEach(obs => {
        const key = `${obs.workflow_key}:${obs.step_name}`;
        if (!stepStats[key]) {
          stepStats[key] = {
            successes: 0,
            errors: 0,
            latencies: [],
            workflow_key: obs.workflow_key,
            step_name: obs.step_name
          };
        }
        
        if (obs.result === 'success') stepStats[key].successes++;
        if (obs.result === 'error') stepStats[key].errors++;
        if (obs.latency_ms) stepStats[key].latencies.push(obs.latency_ms);
      });

      const TenantSuggestion = TenantEntity.wrap(GenomeSuggestion);
      const newSuggestions = [];

      // Generate suggestions based on heuristics
      for (const [key, stats] of Object.entries(stepStats)) {
        const total = stats.successes + stats.errors;
        if (total < 5) continue; // Need minimum data
        
        const errorRate = (stats.errors / total) * 100;
        const avgLatency = stats.latencies.length > 0
          ? stats.latencies.reduce((a, b) => a + b, 0) / stats.latencies.length
          : 0;

        // High error rate → suggest approval
        if (errorRate > 5) {
          newSuggestions.push({
            workflow_key: stats.workflow_key,
            step_name: stats.step_name,
            suggestion_type: 'add_approval',
            payload: { current_error_rate: errorRate.toFixed(1), total_runs: total },
            expected_impact: `Reduce ${errorRate.toFixed(0)}% error rate by adding human approval gate`,
            confidence: Math.min(95, 60 + Math.floor(errorRate))
          });
        }

        // High latency → suggest optimization
        if (avgLatency > 5000 && stats.latencies.length >= 3) {
          newSuggestions.push({
            workflow_key: stats.workflow_key,
            step_name: stats.step_name,
            suggestion_type: 'reduce_timeout',
            payload: { current_avg_latency_ms: avgLatency },
            expected_impact: `Reduce ${(avgLatency / 1000).toFixed(1)}s average latency with timeout optimization`,
            confidence: 70
          });
        }
      }

      // Save suggestions
      for (const sugg of newSuggestions) {
        await TenantSuggestion.create({
          ...sugg,
          state: 'draft'
        });
      }

      loadData();
      alert(`Generated ${newSuggestions.length} new suggestions`);
    } catch (error) {
      alert('Failed to generate suggestions: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const applySuggestion = async (suggestion) => {
    try {
      // Check plan limit
      const planCheck = await checkPlanLimit('genome_apply');
      if (!planCheck.allowed) {
        alert(planCheck.reason + '\n\nUpgrade to ' + planCheck.upgrade_required + ' plan to apply Genome suggestions.');
        return;
      }

      const TenantStep = TenantEntity.wrap(WorkflowStep);
      const steps = await TenantStep.filter({
        step_name: suggestion.step_name
      });

      if (steps.length === 0) {
        alert('Step not found');
        return;
      }

      const step = steps[0];

      // Apply suggestion based on type
      if (suggestion.suggestion_type === 'add_approval') {
        await TenantStep.update(step.id, {
          requires_approval: true,
          risk_level: 'high'
        });
      } else if (suggestion.suggestion_type === 'reduce_timeout') {
        const currentTimeout = step.mapping_json?.timeout_ms || 30000;
        await TenantStep.update(step.id, {
          mapping_json: {
            ...step.mapping_json,
            timeout_ms: Math.floor(currentTimeout * 0.7)
          }
        });
      } else if (suggestion.suggestion_type === 'enable_retry') {
        await TenantStep.update(step.id, {
          retry_on_failure: true
        });
      }

      // Mark suggestion as applied
      const TenantSuggestion = TenantEntity.wrap(GenomeSuggestion);
      await TenantSuggestion.update(suggestion.id, {
        state: 'applied',
        applied_at: new Date().toISOString()
      });

      loadData();
      alert('Suggestion applied successfully!');
    } catch (error) {
      alert('Failed to apply suggestion: ' + error.message);
    }
  };

  const rejectSuggestion = async (suggestionId) => {
    const TenantSuggestion = TenantEntity.wrap(GenomeSuggestion);
    await TenantSuggestion.update(suggestionId, {
      state: 'rejected'
    });
    loadData();
  };

  const getSuggestionIcon = (type) => {
    const icons = {
      add_approval: <AlertCircle className="w-5 h-5 text-yellow-500" />,
      reduce_timeout: <Clock className="w-5 h-5 text-blue-500" />,
      enable_retry: <Zap className="w-5 h-5 text-purple-500" />
    };
    return icons[type] || <TrendingUp className="w-5 h-5 text-gray-500" />;
  };

  const getConfidenceBadge = (confidence) => {
    if (confidence >= 80) return <Badge className="bg-green-100 text-green-800">High Confidence</Badge>;
    if (confidence >= 60) return <Badge className="bg-yellow-100 text-yellow-800">Medium Confidence</Badge>;
    return <Badge className="bg-gray-100 text-gray-800">Low Confidence</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!tenant?.genome_opt_in) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="py-12 text-center">
              <Sparkles className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Genome Learning Disabled</h2>
              <p className="text-gray-600 mb-4">
                Enable genome learning in Settings to get AI-powered workflow optimization suggestions.
              </p>
              <Button onClick={() => window.location.href = '/Settings'}>
                Go to Settings
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-indigo-600" />
              Workflow Genome
            </h1>
            <p className="text-gray-600 mt-2">AI-powered optimization suggestions based on your workflow patterns</p>
          </div>
          
          <Button
            onClick={generateSuggestions}
            disabled={generating}
            className="flex items-center gap-2"
          >
            {generating ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <TrendingUp className="w-4 h-4" />
                Generate Suggestions
              </>
            )}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Observations (30d)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-indigo-600">{stats.observations_30d}</div>
              <p className="text-sm text-gray-600">workflow executions tracked</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Draft Suggestions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{stats.draft_count}</div>
              <p className="text-sm text-gray-600">awaiting review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Applied (30d)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.applied_count}</div>
              <p className="text-sm text-gray-600">optimizations active</p>
            </CardContent>
          </Card>
        </div>

        {/* Suggestions List */}
        <Tabs defaultValue="draft">
          <TabsList>
            <TabsTrigger value="draft">
              Draft ({suggestions.filter(s => s.state === 'draft').length})
            </TabsTrigger>
            <TabsTrigger value="applied">
              Applied ({suggestions.filter(s => s.state === 'applied').length})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected ({suggestions.filter(s => s.state === 'rejected').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="draft" className="mt-6">
            {suggestions.filter(s => s.state === 'draft').length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No new suggestions. Click "Generate Suggestions" to analyze your workflows.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {suggestions.filter(s => s.state === 'draft').map((suggestion) => (
                  <Card key={suggestion.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          {getSuggestionIcon(suggestion.suggestion_type)}
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-lg">{suggestion.workflow_key}</h3>
                              {suggestion.step_name && (
                                <Badge variant="outline">{suggestion.step_name}</Badge>
                              )}
                              {getConfidenceBadge(suggestion.confidence)}
                            </div>
                            
                            <p className="text-gray-700 mb-3">{suggestion.expected_impact}</p>
                            
                            {suggestion.payload && (
                              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                                <p className="text-sm font-medium text-gray-700 mb-1">Analysis:</p>
                                <pre className="text-xs text-gray-600">
                                  {JSON.stringify(suggestion.payload, null, 2)}
                                </pre>
                              </div>
                            )}
                            
                            <div className="flex gap-2">
                              <Button
                                onClick={() => applySuggestion(suggestion)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Apply Suggestion
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => rejectSuggestion(suggestion.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                Reject
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="applied" className="mt-6">
            <div className="space-y-4">
              {suggestions.filter(s => s.state === 'applied').map((suggestion) => (
                <Card key={suggestion.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <CheckCircle className="w-6 h-6 text-green-500" />
                      <div className="flex-1">
                        <h3 className="font-semibold">{suggestion.workflow_key} → {suggestion.step_name}</h3>
                        <p className="text-sm text-gray-600">{suggestion.expected_impact}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Applied: {new Date(suggestion.applied_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="rejected" className="mt-6">
            <div className="space-y-4">
              {suggestions.filter(s => s.state === 'rejected').map((suggestion) => (
                <Card key={suggestion.id} className="opacity-60">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <AlertCircle className="w-6 h-6 text-gray-400" />
                      <div className="flex-1">
                        <h3 className="font-semibold">{suggestion.workflow_key} → {suggestion.step_name}</h3>
                        <p className="text-sm text-gray-600">{suggestion.expected_impact}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}