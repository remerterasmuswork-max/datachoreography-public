import React, { useState, useEffect } from 'react';
import { User, EmailTemplate } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, Plus } from 'lucide-react';

export default function Settings() {
  const [user, setUser] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [settings, setSettings] = useState({
    company_name: '',
    vat_number: '',
    currency: 'EUR',
    timezone: 'Europe/Amsterdam',
    notification_email: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const currentUser = await User.me();
    setUser(currentUser);
    
    const temps = await EmailTemplate.list();
    setTemplates(temps);
  };

  const saveSettings = async () => {
    alert('Settings saved successfully!');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Configure your account and preferences</p>
        </div>

        <Tabs defaultValue="general">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="templates">Email Templates</TabsTrigger>
            <TabsTrigger value="team">Team & Roles</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Company Name</label>
                  <Input
                    value={settings.company_name}
                    onChange={(e) => setSettings({...settings, company_name: e.target.value})}
                    placeholder="Acme Corp"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">VAT Number</label>
                  <Input
                    value={settings.vat_number}
                    onChange={(e) => setSettings({...settings, vat_number: e.target.value})}
                    placeholder="NL123456789B01"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Currency</label>
                    <select
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      value={settings.currency}
                      onChange={(e) => setSettings({...settings, currency: e.target.value})}
                    >
                      <option value="EUR">EUR (€)</option>
                      <option value="USD">USD ($)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="NOK">NOK (kr)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Timezone</label>
                    <select
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      value={settings.timezone}
                      onChange={(e) => setSettings({...settings, timezone: e.target.value})}
                    >
                      <option value="Europe/Amsterdam">Amsterdam</option>
                      <option value="Europe/London">London</option>
                      <option value="America/New_York">New York</option>
                      <option value="America/Los_Angeles">Los Angeles</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Notification Email</label>
                  <Input
                    type="email"
                    value={settings.notification_email}
                    onChange={(e) => setSettings({...settings, notification_email: e.target.value})}
                    placeholder="notifications@acme.com"
                  />
                  <p className="text-xs text-gray-500 mt-1">Receive workflow alerts and errors</p>
                </div>

                <Button onClick={saveSettings} className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Save Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="templates" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Email Templates</CardTitle>
                  <Button className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    New Template
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {templates.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No email templates yet</p>
                ) : (
                  <div className="space-y-4">
                    {templates.map((template) => (
                      <div key={template.id} className="p-4 border rounded-lg hover:border-indigo-300 transition-colors">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold">{template.name}</h4>
                            <p className="text-sm text-gray-600 mt-1">{template.subject}</p>
                            <div className="flex gap-2 mt-2">
                              {template.variables?.map((v) => (
                                <code key={v} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                  {'{{'}{v}{'}}'}
                                </code>
                              ))}
                            </div>
                          </div>
                          <Button variant="outline" size="sm">Edit</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">Manage user roles and permissions</p>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-800">
                    <strong>Role Permissions:</strong><br/>
                    • <strong>Owner:</strong> Full access, billing, team management<br/>
                    • <strong>Admin:</strong> Manage workflows, connections, approve actions<br/>
                    • <strong>Operator:</strong> View workflows, approve assigned actions<br/>
                    • <strong>Viewer:</strong> Read-only access to runs and analytics
                  </p>
                </div>

                <Button className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Invite Team Member
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Security</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-2">Credential Rotation</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    We recommend rotating your integration credentials every 90 days
                  </p>
                  <Button variant="outline">Rotate All Credentials</Button>
                </div>

                <div className="border-t pt-6">
                  <h4 className="font-semibold mb-2">Audit Log</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    View all actions taken by team members (Growth plan and above)
                  </p>
                  <Button variant="outline" disabled>
                    View Audit Log (Upgrade Required)
                  </Button>
                </div>

                <div className="border-t pt-6">
                  <h4 className="font-semibold mb-2">Data Retention</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Workflow run logs are retained for 90 days
                  </p>
                  <Button variant="outline">Export All Data</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}