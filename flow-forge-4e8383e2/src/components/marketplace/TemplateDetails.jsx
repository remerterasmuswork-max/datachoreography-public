import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  X,
  Star,
  Download,
  Clock,
  Shield,
  CheckCircle,
  AlertCircle,
  Code,
  FileText,
  Zap,
  DollarSign,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import InstallWizard from './InstallWizard';

export default function TemplateDetails({ template, onClose }) {
  const [showInstaller, setShowInstaller] = useState(false);

  if (showInstaller) {
    return (
      <InstallWizard
        template={template}
        onClose={() => setShowInstaller(false)}
        onComplete={() => {
          setShowInstaller(false);
          onClose();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className="text-5xl">{template.icon}</div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-2xl font-bold text-gray-900">{template.name}</h1>
                      <Badge>v{template.version}</Badge>
                    </div>
                    <p className="text-gray-600 mb-3">{template.description}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-semibold">{template.metrics.rating}</span>
                        <span className="text-gray-500">({template.metrics.reviews} reviews)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Download className="w-4 h-4 text-gray-500" />
                        <span>{template.metrics.installs.toLocaleString()} installs</span>
                      </div>
                      <Badge variant="outline">{template.category}</Badge>
                    </div>
                  </div>
                </div>
                
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={() => setShowInstaller(true)}
                  className="bg-indigo-600 hover:bg-indigo-700"
                  size="lg"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Install Template
                </Button>
                <Button variant="outline" size="lg">
                  <FileText className="w-4 h-4 mr-2" />
                  View Manifest
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Business Value Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <Clock className="w-8 h-8 text-green-600 mb-2" />
              <p className="text-sm text-gray-600">Time Saved</p>
              <p className="text-2xl font-bold text-gray-900">{template.metrics.time_saved_per_run}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <DollarSign className="w-8 h-8 text-purple-600 mb-2" />
              <p className="text-sm text-gray-600">Revenue Impact</p>
              <p className="text-2xl font-bold text-gray-900">
                {template.metrics.revenue_impact_score >= 8 ? 'Very High' :
                 template.metrics.revenue_impact_score >= 6 ? 'High' :
                 template.metrics.revenue_impact_score >= 4 ? 'Medium' : 'Low'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <Zap className="w-8 h-8 text-indigo-600 mb-2" />
              <p className="text-sm text-gray-600">Workflow Steps</p>
              <p className="text-2xl font-bold text-gray-900">{template.workflow_json.steps.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <TrendingUp className="w-8 h-8 text-blue-600 mb-2" />
              <p className="text-sm text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900">{template.metrics.success_rate}%</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Card>
          <Tabs defaultValue="overview">
            <CardHeader>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="workflow">Workflow</TabsTrigger>
                <TabsTrigger value="permissions">Permissions</TabsTrigger>
                <TabsTrigger value="compliance">Compliance</TabsTrigger>
                <TabsTrigger value="changelog">Changelog</TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent>
              <TabsContent value="overview">
                <div className="space-y-6">
                  {/* What It Does */}
                  <div>
                    <h3 className="font-semibold text-lg mb-3">What This Automation Does</h3>
                    <div className="space-y-2">
                      {template.workflow_json.steps.map((step, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{step.name}</p>
                            <p className="text-sm text-gray-600">{step.description}</p>
                            {step.requires_approval && (
                              <Badge className="mt-2 bg-yellow-100 text-yellow-800">
                                Requires Approval
                              </Badge>
                            )}
                          </div>
                          <Badge variant="outline">{step.provider}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Required Connections */}
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Required Services</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {template.required_connections.map(conn => (
                        <div key={conn} className="p-3 border-2 border-gray-200 rounded-lg">
                          <p className="font-medium capitalize">{conn}</p>
                          <p className="text-xs text-gray-600 mt-1">Connection required</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {template.tags.map(tag => (
                        <Badge key={tag} variant="outline">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="workflow">
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center gap-3 mb-2">
                      <Zap className="w-5 h-5 text-green-600" />
                      <h4 className="font-semibold text-green-900">Trigger</h4>
                    </div>
                    <p className="text-sm text-green-800">
                      Type: <span className="font-mono bg-green-200 px-2 py-0.5 rounded">{template.workflow_json.trigger.type}</span>
                    </p>
                    <p className="text-sm text-green-800 mt-1">
                      {template.workflow_json.trigger.description}
                    </p>
                  </div>

                  {template.workflow_json.steps.map((step, index) => (
                    <div key={index}>
                      <div className="flex justify-center py-2">
                        <ArrowRight className="w-6 h-6 text-gray-400 rotate-90" />
                      </div>
                      
                      <div className="p-4 border-2 border-indigo-200 rounded-lg bg-indigo-50">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-indigo-900">
                              Step {index + 1}: {step.name}
                            </h4>
                            <p className="text-sm text-indigo-700 mt-1">{step.description}</p>
                          </div>
                          <Badge className="bg-indigo-600 text-white">{step.provider}</Badge>
                        </div>

                        {step.inputs && Object.keys(step.inputs).length > 0 && (
                          <div className="mt-3 p-3 bg-white rounded border border-indigo-200">
                            <p className="text-xs font-medium text-gray-700 mb-2">Inputs:</p>
                            <pre className="text-xs text-gray-600 font-mono overflow-x-auto">
                              {JSON.stringify(step.inputs, null, 2)}
                            </pre>
                          </div>
                        )}

                        {step.requires_approval && (
                          <div className="mt-3 flex items-center gap-2 text-sm text-yellow-800 bg-yellow-50 p-2 rounded border border-yellow-200">
                            <AlertCircle className="w-4 h-4" />
                            <span>This step requires manual approval before execution</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="permissions">
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">Required Permissions</h4>
                    <p className="text-sm text-blue-800 mb-3">
                      This template will request the following permissions when installed:
                    </p>
                    <ul className="space-y-2">
                      {template.permissions.map((permission, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-blue-900">
                          <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                          <span>{permission}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {template.gdpr.pii_fields_collected.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h4 className="font-semibold text-yellow-900 mb-2">Data Collection Notice</h4>
                      <p className="text-sm text-yellow-800 mb-3">
                        This workflow processes the following types of personal data:
                      </p>
                      <ul className="space-y-1">
                        {template.gdpr.pii_fields_collected.map((field, index) => (
                          <li key={index} className="text-sm text-yellow-900">
                            • {field}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="compliance">
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg border-2 ${template.gdpr.required ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center gap-3 mb-3">
                      <Shield className={`w-6 h-6 ${template.gdpr.required ? 'text-green-600' : 'text-gray-600'}`} />
                      <h4 className="font-semibold text-gray-900">GDPR Compliance</h4>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span>GDPR Required:</span>
                        <span className="font-semibold">{template.gdpr.required ? 'Yes' : 'No'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Consent Needed:</span>
                        <span className="font-semibold">{template.gdpr.consent_needed ? 'Yes' : 'No'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Data Retention:</span>
                        <span className="font-semibold">{template.gdpr.retention_days} days</span>
                      </div>
                    </div>
                  </div>

                  {template.gdpr.purpose && (
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-2">Data Processing Purpose</h4>
                      <p className="text-sm text-gray-700">{template.gdpr.purpose}</p>
                    </div>
                  )}

                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-blue-900 mb-2">Audit Trail</h4>
                    <p className="text-sm text-blue-800">
                      All executions of this workflow are logged to the compliance audit trail with PII redaction.
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="changelog">
                <div className="space-y-4">
                  {template.changelog && template.changelog.length > 0 ? (
                    template.changelog.map((change, index) => (
                      <div key={index} className="p-4 border-l-4 border-indigo-500 bg-gray-50 rounded-r-lg">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge>v{change.version}</Badge>
                          <span className="text-sm text-gray-600">{change.date}</span>
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-2">{change.title}</h4>
                        <ul className="space-y-1">
                          {change.changes.map((item, idx) => (
                            <li key={idx} className="text-sm text-gray-700">• {item}</li>
                          ))}
                        </ul>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No changelog available for this template</p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}