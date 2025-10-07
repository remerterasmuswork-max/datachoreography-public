import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Zap,
  Download,
  CheckCircle,
  XCircle,
  Shield,
  TrendingUp,
  Star,
  Loader,
  ExternalLink,
  Settings
} from 'lucide-react';
import TenantEntity from '../components/TenantEntity';
import { AgentSkill, AgentInstall, AgentExecutionLog } from '@/api/entities';

export default function AgentSkills() {
  const [loading, setLoading] = useState(true);
  const [skills, setSkills] = useState([]);
  const [installs, setInstalls] = useState([]);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [filter, setFilter] = useState('all'); // all, installed, available

  useEffect(() => {
    loadSkills();
  }, []);

  const loadSkills = async () => {
    try {
      // Load available skills (global)
      const allSkills = await AgentSkill.list('-install_count', 50);
      
      // Load tenant installs
      const TenantAgentInstall = TenantEntity.wrap(AgentInstall);
      const tenantInstalls = await TenantAgentInstall.list();

      setSkills(allSkills);
      setInstalls(tenantInstalls);
    } catch (error) {
      console.error('Failed to load skills:', error);
    } finally {
      setLoading(false);
    }
  };

  const isInstalled = (skillId) => {
    return installs.some(i => i.skill_id === skillId);
  };

  const getInstall = (skillId) => {
    return installs.find(i => i.skill_id === skillId);
  };

  const installSkill = async (skill) => {
    try {
      const TenantAgentInstall = TenantEntity.wrap(AgentInstall);
      await TenantAgentInstall.create({
        skill_id: skill.skill_id,
        installed_version: skill.current_version,
        enabled: true,
        permissions_granted: skill.required_scopes || [],
        auto_update: false
      });

      alert(`Successfully installed ${skill.skill_name}`);
      loadSkills();
    } catch (error) {
      alert('Failed to install skill: ' + error.message);
    }
  };

  const uninstallSkill = async (skillId) => {
    if (!confirm('Are you sure? This will disable the skill and remove all configurations.')) {
      return;
    }

    try {
      const install = getInstall(skillId);
      if (install) {
        const TenantAgentInstall = TenantEntity.wrap(AgentInstall);
        await TenantAgentInstall.delete(install.id);
        alert('Skill uninstalled successfully');
        loadSkills();
      }
    } catch (error) {
      alert('Failed to uninstall skill: ' + error.message);
    }
  };

  const toggleSkill = async (skillId) => {
    try {
      const install = getInstall(skillId);
      if (install) {
        const TenantAgentInstall = TenantEntity.wrap(AgentInstall);
        await TenantAgentInstall.update(install.id, {
          enabled: !install.enabled
        });
        loadSkills();
      }
    } catch (error) {
      alert('Failed to toggle skill: ' + error.message);
    }
  };

  const getSafetyBadge = (level) => {
    const variants = {
      safe: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      requires_approval: { color: 'bg-yellow-100 text-yellow-800', icon: Shield },
      high_risk: { color: 'bg-red-100 text-red-800', icon: XCircle }
    };
    const variant = variants[level] || variants.requires_approval;
    const Icon = variant.icon;
    
    return (
      <Badge className={`${variant.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {level?.replace('_', ' ')}
      </Badge>
    );
  };

  const filteredSkills = skills.filter(skill => {
    if (filter === 'installed') return isInstalled(skill.skill_id);
    if (filter === 'available') return !isInstalled(skill.skill_id);
    return true;
  });

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
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className="w-10 h-10 text-indigo-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Agent Skills</h1>
                <p className="text-gray-600">Curated automation plugins for your workflows</p>
              </div>
            </div>
            <Button variant="outline">
              Request Custom Skill
            </Button>
          </div>
        </div>

        {/* Filter Tabs */}
        <Tabs value={filter} onValueChange={setFilter} className="mb-6">
          <TabsList>
            <TabsTrigger value="all">All Skills ({skills.length})</TabsTrigger>
            <TabsTrigger value="installed">
              Installed ({installs.length})
            </TabsTrigger>
            <TabsTrigger value="available">
              Available ({skills.length - installs.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Skills Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSkills.map((skill) => {
            const install = getInstall(skill.skill_id);
            const installed = !!install;

            return (
              <Card 
                key={skill.skill_id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedSkill(skill)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{skill.skill_name}</CardTitle>
                      <p className="text-sm text-gray-600 capitalize mt-1">
                        {skill.category}
                      </p>
                    </div>
                    {skill.publisher_verified && (
                      <Badge className="bg-blue-100 text-blue-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-700 line-clamp-3">
                    {skill.description}
                  </p>

                  <div className="flex items-center gap-2">
                    {getSafetyBadge(skill.safety_level)}
                    {skill.rating_avg > 0 && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-500" />
                        {skill.rating_avg.toFixed(1)}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>{skill.install_count} installs</span>
                    <span>v{skill.current_version}</span>
                  </div>

                  {skill.required_connections && skill.required_connections.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Required Connections:</p>
                      <div className="flex flex-wrap gap-1">
                        {skill.required_connections.map(conn => (
                          <Badge key={conn} variant="outline" className="text-xs capitalize">
                            {conn}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-2 space-y-2">
                    {installed ? (
                      <>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant={install.enabled ? 'outline' : 'default'}
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSkill(skill.skill_id);
                            }}
                          >
                            {install.enabled ? 'Disable' : 'Enable'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              uninstallSkill(skill.skill_id);
                            }}
                          >
                            Uninstall
                          </Button>
                        </div>
                        {install.execution_count > 0 && (
                          <p className="text-xs text-gray-600 text-center">
                            {install.execution_count} executions
                          </p>
                        )}
                      </>
                    ) : (
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          installSkill(skill);
                        }}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Install Skill
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredSkills.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No skills found</p>
            </CardContent>
          </Card>
        )}

        {/* Skill Detail Modal */}
        {selectedSkill && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50"
            onClick={() => setSelectedSkill(null)}
          >
            <Card
              className="w-full max-w-3xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl">{selectedSkill.skill_name}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      by {selectedSkill.publisher} • v{selectedSkill.current_version}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedSkill(null)}
                  >
                    Close
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-gray-700">{selectedSkill.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Safety Level</p>
                    {getSafetyBadge(selectedSkill.safety_level)}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Category</p>
                    <p className="font-medium capitalize">{selectedSkill.category}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Installs</p>
                    <p className="font-medium">{selectedSkill.install_count}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Rating</p>
                    <p className="font-medium">
                      {selectedSkill.rating_avg > 0
                        ? `${selectedSkill.rating_avg.toFixed(1)} / 5.0`
                        : 'No ratings yet'}
                    </p>
                  </div>
                </div>

                {selectedSkill.required_connections && selectedSkill.required_connections.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Required Connections</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedSkill.required_connections.map(conn => (
                        <Badge key={conn} className="capitalize">{conn}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedSkill.required_scopes && selectedSkill.required_scopes.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Required Permissions</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedSkill.required_scopes.map(scope => (
                        <Badge key={scope} variant="outline">{scope}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedSkill.documentation_url && (
                  <div>
                    <a
                      href={selectedSkill.documentation_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Documentation
                    </a>
                  </div>
                )}

                <div className="pt-4 border-t">
                  {isInstalled(selectedSkill.skill_id) ? (
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1">
                        <Settings className="w-4 h-4 mr-2" />
                        Configure
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => uninstallSkill(selectedSkill.skill_id)}
                      >
                        Uninstall
                      </Button>
                    </div>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => installSkill(selectedSkill)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Install Skill
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}