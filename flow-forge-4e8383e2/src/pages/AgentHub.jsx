import React, { useState, useEffect } from 'react';
import { AgentInstall, AgentSkill, AgentExecutionLog } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bot,
  Zap,
  Clock,
  CheckCircle,
  XCircle,
  Settings,
  TrendingUp,
  AlertCircle,
  Play,
  Pause,
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function AgentHub() {
  const [installedAgents, setInstalledAgents] = useState([]);
  const [availableSkills, setAvailableSkills] = useState([]);
  const [executionLogs, setExecutionLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeAgents: 0,
    totalExecutions: 0,
    successRate: 0,
  });

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      const installs = await AgentInstall.list();
      setInstalledAgents(installs);

      const skills = await AgentSkill.filter({ status: 'approved' });
      setAvailableSkills(skills);

      const logs = await AgentExecutionLog.list('-started_at', 100);
      setExecutionLogs(logs);

      // Calculate stats
      const activeCount = installs.filter((i) => i.enabled).length;
      const totalExecs = logs.length;
      const successfulExecs = logs.filter((l) => l.status === 'success').length;
      const successRate = totalExecs > 0 ? (successfulExecs / totalExecs * 100).toFixed(1) : 0;

      setStats({
        activeAgents: activeCount,
        totalExecutions: totalExecs,
        successRate: parseFloat(successRate),
      });
    } catch (error) {
      console.error('Failed to load agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAgent = async (agentId, currentState) => {
    try {
      await AgentInstall.update(agentId, { enabled: !currentState });
      loadAgents();
    } catch (error) {
      alert(`Failed to toggle agent: ${error.message}`);
    }
  };

  const triggerManual = async (agentId) => {
    alert('Manual trigger functionality coming soon!');
    // TODO: Call backend agent execution endpoint
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Bot className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Bot className="w-8 h-8 text-green-600" />
            Agent Hub
          </h1>
          <p className="text-gray-600 mt-2">Manage your automation agents and skills</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Agents</p>
                  <p className="text-3xl font-bold text-green-600">{stats.activeAgents}</p>
                </div>
                <Zap className="w-12 h-12 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Executions</p>
                  <p className="text-3xl font-bold text-indigo-600">{stats.totalExecutions}</p>
                </div>
                <TrendingUp className="w-12 h-12 text-indigo-200" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Success Rate</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.successRate}%</p>
                </div>
                <CheckCircle className="w-12 h-12 text-blue-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="installed">
          <TabsList>
            <TabsTrigger value="installed">
              Installed Agents ({installedAgents.length})
            </TabsTrigger>
            <TabsTrigger value="available">
              Available Skills ({availableSkills.length})
            </TabsTrigger>
            <TabsTrigger value="logs">Execution History</TabsTrigger>
          </TabsList>

          <TabsContent value="installed" className="mt-6">
            {installedAgents.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Bot className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No agents installed yet</p>
                  <Button>Browse Agent Skills</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {installedAgents.map((agent, index) => (
                  <motion.div
                    key={agent.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                              <Bot className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{agent.skill_id}</CardTitle>
                              <p className="text-sm text-gray-600">v{agent.installed_version}</p>
                            </div>
                          </div>
                          <Switch
                            checked={agent.enabled}
                            onCheckedChange={() => toggleAgent(agent.id, agent.enabled)}
                          />
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-gray-600">Executions:</span>
                            <span className="font-semibold ml-2">{agent.execution_count || 0}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Errors:</span>
                            <span className="font-semibold ml-2 text-red-600">
                              {agent.error_count || 0}
                            </span>
                          </div>
                        </div>

                        {agent.last_execution && (
                          <div className="text-sm text-gray-600">
                            Last run: {new Date(agent.last_execution).toLocaleString()}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => triggerManual(agent.id)}
                            className="flex-1"
                            disabled={!agent.enabled}
                          >
                            <Play className="w-4 h-4 mr-1" />
                            Run Now
                          </Button>
                          <Button size="sm" variant="outline">
                            <Settings className="w-4 h-4 mr-1" />
                            Configure
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="available" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableSkills.map((skill) => (
                <Card key={skill.skill_id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{skill.icon_url || '🤖'}</div>
                      <div>
                        <CardTitle className="text-lg">{skill.skill_name}</CardTitle>
                        <p className="text-xs text-gray-600">{skill.publisher}</p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-700 line-clamp-2">{skill.description}</p>

                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="outline">{skill.category}</Badge>
                      <Badge className={
                        skill.safety_level === 'safe' ? 'bg-green-100 text-green-800' :
                        skill.safety_level === 'requires_approval' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }>
                        {skill.safety_level}
                      </Badge>
                    </div>

                    <div className="text-xs text-gray-600">
                      {skill.install_count?.toLocaleString()} installs • {skill.rating_avg}★
                    </div>

                    <Button className="w-full bg-green-600 hover:bg-green-700">
                      Install Agent
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="logs" className="mt-6">
            <div className="space-y-3">
              {executionLogs.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No execution history yet</p>
                  </CardContent>
                </Card>
              ) : (
                executionLogs.slice(0, 20).map((log) => (
                  <Card key={log.execution_id}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {log.status === 'success' ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : log.status === 'error' ? (
                            <XCircle className="w-5 h-5 text-red-500" />
                          ) : (
                            <Clock className="w-5 h-5 text-yellow-500" />
                          )}
                          <div>
                            <p className="font-semibold text-sm">{log.skill_id}</p>
                            <p className="text-xs text-gray-600">
                              {new Date(log.started_at).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          {log.duration_ms && (
                            <span className="text-sm text-gray-600">
                              {(log.duration_ms / 1000).toFixed(2)}s
                            </span>
                          )}
                          <Badge
                            className={
                              log.status === 'success'
                                ? 'bg-green-100 text-green-800'
                                : log.status === 'error'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }
                          >
                            {log.status}
                          </Badge>
                        </div>
                      </div>

                      {log.error_message && (
                        <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
                          <p className="text-sm text-red-800">{log.error_message}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}