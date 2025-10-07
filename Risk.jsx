import React, { useState, useEffect } from 'react';
import { RiskConfig } from '@/api/entities';
import TenantEntity, { getCurrentTenantId } from '../components/TenantEntity';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Shield, AlertTriangle, Power, Loader, Save } from 'lucide-react';

export default function Risk() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const tenantId = await getCurrentTenantId();
      const configs = await RiskConfig.filter({ tenant_id: tenantId });
      
      if (configs.length > 0) {
        setConfig(configs[0]);
      } else {
        // Create default config
        const defaultConfig = await RiskConfig.create({
          tenant_id: tenantId,
          max_refund_amount: 10000,
          require_approval_above: 1000,
          kill_switch: false,
          dry_run: true,
          max_daily_actions: 500,
          block_high_risk_steps: false
        });
        setConfig(defaultConfig);
      }
    } catch (error) {
      console.error('Failed to load risk config:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      await RiskConfig.update(config.tenant_id, config);
      alert('Risk configuration saved successfully');
    } catch (error) {
      alert('Failed to save config: ' + error.message);
    } finally {
      setSaving(false);
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
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-8 h-8 text-indigo-600" />
            Risk & Guardrails
          </h1>
          <p className="text-gray-600 mt-2">Configure safety limits and approval thresholds</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Emergency Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Power className="w-5 h-5 text-red-600" />
                  <span className="font-semibold text-red-900">Kill Switch</span>
                </div>
                <p className="text-sm text-red-700">
                  Immediately halt ALL workflow execution across your account
                </p>
              </div>
              <Switch
                checked={config.kill_switch}
                onCheckedChange={(checked) => setConfig({...config, kill_switch: checked})}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <span className="font-semibold text-yellow-900">Dry Run Mode</span>
                </div>
                <p className="text-sm text-yellow-700">
                  Log all actions without executing them (simulation mode)
                </p>
              </div>
              <Switch
                checked={config.dry_run}
                onCheckedChange={(checked) => setConfig({...config, dry_run: checked})}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Financial Guardrails</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Maximum Refund Amount (€)
              </label>
              <Input
                type="number"
                value={config.max_refund_amount}
                onChange={(e) => setConfig({...config, max_refund_amount: parseFloat(e.target.value)})}
                className="max-w-xs"
              />
              <p className="text-xs text-gray-500 mt-1">
                Refunds above this amount will be blocked automatically
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Require Approval Above (€)
              </label>
              <Input
                type="number"
                value={config.require_approval_above}
                onChange={(e) => setConfig({...config, require_approval_above: parseFloat(e.target.value)})}
                className="max-w-xs"
              />
              <p className="text-xs text-gray-500 mt-1">
                Transactions above this amount require manual approval
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Operational Limits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Maximum Daily Actions
              </label>
              <Input
                type="number"
                value={config.max_daily_actions}
                onChange={(e) => setConfig({...config, max_daily_actions: parseInt(e.target.value)})}
                className="max-w-xs"
              />
              <p className="text-xs text-gray-500 mt-1">
                Circuit breaker trips if daily API calls exceed this limit
              </p>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <span className="font-medium">Block High-Risk Steps</span>
                <p className="text-sm text-gray-600">
                  Automatically block workflow steps marked as "high" risk level
                </p>
              </div>
              <Switch
                checked={config.block_high_risk_steps}
                onCheckedChange={(checked) => setConfig({...config, block_high_risk_steps: checked})}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={loadConfig}>
            Reset
          </Button>
          <Button onClick={saveConfig} disabled={saving} className="flex items-center gap-2">
            {saving ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Configuration
              </>
            )}
          </Button>
        </div>

        {/* Safety Notice */}
        <Card className="mt-6">
          <CardContent className="py-4">
            <p className="text-sm text-gray-600">
              <strong>⚠️ Safety Note:</strong> These guardrails are enforced client-side in the current implementation. 
              For production deployments, consider implementing server-side enforcement via an external backend service.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}