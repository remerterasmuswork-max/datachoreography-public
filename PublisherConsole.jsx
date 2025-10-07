import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Upload,
  Code,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  Settings,
  Shield,
  AlertCircle
} from 'lucide-react';

export default function PublisherConsole() {
  const [templateData, setTemplateData] = useState({
    name: '',
    description: '',
    category: 'finance',
    complexity: 'medium',
    required_connections: [],
    workflow_json: '',
  });

  const [submittedTemplates, setSubmittedTemplates] = useState([
    {
      id: '1',
      name: 'My Custom Workflow',
      status: 'under_review',
      submitted_date: '2024-12-20',
      version: '1.0.0'
    }
  ]);

  const handleSubmit = async () => {
    alert('Template submission functionality coming soon!');
    // TODO: Implement template submission
  };

  const getStatusBadge = (status) => {
    const variants = {
      under_review: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle },
      draft: { color: 'bg-gray-100 text-gray-800', icon: FileText }
    };
    
    const variant = variants[status] || variants.draft;
    const Icon = variant.icon;
    
    return (
      <Badge className={`${variant.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Upload className="w-8 h-8 text-indigo-600" />
            Publisher Console
          </h1>
          <p className="text-gray-600 mt-2">Submit and manage your automation templates</p>
        </div>

        <Tabs defaultValue="submit">
          <TabsList>
            <TabsTrigger value="submit">Submit New Template</TabsTrigger>
            <TabsTrigger value="my-templates">My Templates</TabsTrigger>
            <TabsTrigger value="guidelines">Guidelines</TabsTrigger>
          </TabsList>

          <TabsContent value="submit" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Create New Template</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Basic Information</h3>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Template Name *</label>
                    <Input
                      placeholder="My Awesome Automation"
                      value={templateData.name}
                      onChange={(e) => setTemplateData({...templateData, name: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Description *</label>
                    <Textarea
                      placeholder="Describe what this template does..."
                      value={templateData.description}
                      onChange={(e) => setTemplateData({...templateData, description: e.target.value})}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Category *</label>
                      <select
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        value={templateData.category}
                        onChange={(e) => setTemplateData({...templateData, category: e.target.value})}
                      >
                        <option value="finance">Finance & Accounting</option>
                        <option value="operations">Operations</option>
                        <option value="compliance">Compliance & Risk</option>
                        <option value="customer">Customer Success</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Complexity *</label>
                      <select
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        value={templateData.complexity}
                        onChange={(e) => setTemplateData({...templateData, complexity: e.target.value})}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Workflow JSON */}
                <div>
                  <h3 className="font-semibold text-lg mb-2">Workflow Definition</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Paste your workflow JSON manifest (see guidelines for schema)
                  </p>
                  <Textarea
                    placeholder='{"trigger": {...}, "steps": [...]}'
                    value={templateData.workflow_json}
                    onChange={(e) => setTemplateData({...templateData, workflow_json: e.target.value})}
                    rows={12}
                    className="font-mono text-sm"
                  />
                </div>

                {/* Required Connections */}
                <div>
                  <h3 className="font-semibold text-lg mb-3">Required Connections</h3>
                  <div className="flex flex-wrap gap-2">
                    {['shopify', 'stripe', 'xero', 'email', 'slack'].map(conn => (
                      <label key={conn} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          className="w-4 h-4"
                          checked={templateData.required_connections.includes(conn)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setTemplateData({
                                ...templateData,
                                required_connections: [...templateData.required_connections, conn]
                              });
                            } else {
                              setTemplateData({
                                ...templateData,
                                required_connections: templateData.required_connections.filter(c => c !== conn)
                              });
                            }
                          }}
                        />
                        <span className="capitalize">{conn}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* GDPR Notice */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-yellow-900 mb-1">GDPR Compliance</h4>
                      <p className="text-sm text-yellow-800">
                        Templates that process personal data must include GDPR metadata (consent requirements, 
                        retention periods, etc.). See guidelines for details.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    onClick={handleSubmit}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Submit for Review
                  </Button>
                  <Button variant="outline">
                    Save as Draft
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="my-templates" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Submitted Templates</CardTitle>
              </CardHeader>
              <CardContent>
                {submittedTemplates.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No templates submitted yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {submittedTemplates.map(template => (
                      <div key={template.id} className="p-4 border-2 rounded-lg hover:border-indigo-300">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-lg">{template.name}</h3>
                          {getStatusBadge(template.status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>v{template.version}</span>
                          <span>•</span>
                          <span>Submitted {template.submitted_date}</span>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" variant="outline">
                            <Code className="w-4 h-4 mr-1" />
                            View Code
                          </Button>
                          <Button size="sm" variant="outline">
                            <Settings className="w-4 h-4 mr-1" />
                            Update
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="guidelines" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Template Submission Guidelines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">Template Manifest Schema</h3>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`{
  "template_id": "unique_id",
  "name": "Template Name",
  "description": "What it does",
  "category": "finance|operations|compliance|customer",
  "complexity": "low|medium|high",
  "version": "1.0.0",
  "required_connections": ["shopify", "stripe"],
  "permissions": ["Read orders", "Create invoices"],
  "workflow_json": {
    "trigger": {
      "type": "webhook|schedule|manual",
      "config": {}
    },
    "steps": [
      {
        "name": "Step Name",
        "provider": "shopify",
        "action": "orders.get",
        "inputs": {},
        "requires_approval": false
      }
    ]
  },
  "gdpr": {
    "required": true,
    "consent_needed": true,
    "pii_fields_collected": ["email"],
    "retention_days": 2555
  },
  "metrics": {
    "time_saved_per_run": "15 min",
    "revenue_impact_score": 8
  }
}`}
                  </pre>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Review Criteria</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Clear, accurate description of what the template does</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Proper GDPR metadata for templates processing personal data</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">All required connections and permissions declared</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Valid workflow JSON with proper error handling</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Realistic metrics estimates (time saved, revenue impact)</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Need Help?</h4>
                  <p className="text-sm text-blue-800">
                    Check out our template development documentation or join the publisher community forum.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}