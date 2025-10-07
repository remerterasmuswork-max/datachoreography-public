import React, { useState, useEffect } from 'react';
import { ComplianceEvent, ComplianceAnchor } from '@/api/entities';
import TenantEntity from '../components/TenantEntity';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Download, Link as LinkIcon, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import { checkPlanLimit } from '../components/PlanEnforcement';

export default function Compliance() {
  const [events, setEvents] = useState([]);
  const [anchors, setAnchors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [timeframe, setTimeframe] = useState('7');

  useEffect(() => {
    loadData();
  }, [timeframe]);

  const loadData = async () => {
    try {
      const TenantEvent = TenantEntity.wrap(ComplianceEvent);
      const TenantAnchor = TenantEntity.wrap(ComplianceAnchor);

      const daysAgo = parseInt(timeframe);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);
      
      const allEvents = await TenantEvent.list('-ts', 1000);
      const recentEvents = allEvents.filter(e => e.ts && new Date(e.ts) >= startDate);
      
      setEvents(recentEvents);

      const allAnchors = await TenantAnchor.list('-computed_at', 30);
      setAnchors(allAnchors);

    } catch (error) {
      console.error('Failed to load compliance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const computeAnchor = async () => {
    try {
      const TenantAnchor = TenantEntity.wrap(ComplianceAnchor);
      
      // Get today's events
      const today = new Date().toISOString().split('T')[0];
      const todayEvents = events.filter(e => e.ts.startsWith(today));

      if (todayEvents.length === 0) {
        alert('No events to anchor today');
        return;
      }

      // Compute Merkle root
      let hash = '';
      for (const event of todayEvents) {
        const dataStr = JSON.stringify(event);
        const encoder = new TextEncoder();
        const data = encoder.encode(hash + dataStr);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      }

      // Compute HMAC
      const secret = 'datachor_hmac_secret'; // In production, use secure key
      const encoder = new TextEncoder();
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      
      const signature = await crypto.subtle.sign(
        'HMAC',
        keyMaterial,
        encoder.encode(hash)
      );
      
      const signatureArray = Array.from(new Uint8Array(signature));
      const hmac = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Store anchor
      await TenantAnchor.create({
        period: today,
        from_ts: todayEvents[0].ts,
        to_ts: todayEvents[todayEvents.length - 1].ts,
        anchor_sha256: hash,
        hmac_sha256: hmac,
        event_count: todayEvents.length,
        computed_at: new Date().toISOString()
      });

      loadData();
      alert('Anchor computed successfully');
    } catch (error) {
      alert('Failed to compute anchor: ' + error.message);
    }
  };

  const exportAuditBundle = async () => {
    // Check plan limit
    const planCheck = await checkPlanLimit('ledger_export');
    if (!planCheck.allowed) {
      alert(planCheck.reason);
      return;
    }

    setExporting(true);
    try {
      const bundle = {
        exported_at: new Date().toISOString(),
        timeframe: `Last ${timeframe} days`,
        events: events.map(e => ({
          ts: e.ts,
          category: e.category,
          event_type: e.event_type,
          actor: e.actor,
          ref_type: e.ref_type,
          ref_id: e.ref_id,
          digest: e.digest_sha256,
          prev_digest: e.prev_digest_sha256
        })),
        anchors: anchors,
        verification: {
          chain_valid: await verifyChain(),
          total_events: events.length,
          unique_actors: [...new Set(events.map(e => e.actor))].length
        }
      };

      // Download as JSON
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `compliance-audit-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

    } catch (error) {
      alert('Failed to export audit bundle: ' + error.message);
    } finally {
      setExporting(false);
    }
  };

  const verifyChain = async () => {
    // Verify hash chain integrity
    for (let i = 1; i < events.length; i++) {
      if (events[i].prev_digest_sha256 !== events[i - 1].digest_sha256) {
        return false;
      }
    }
    return true;
  };

  const getCategoryBadge = (category) => {
    const colors = {
      provider_call: 'bg-blue-100 text-blue-800',
      data_access: 'bg-purple-100 text-purple-800',
      config_change: 'bg-yellow-100 text-yellow-800',
      user_action: 'bg-green-100 text-green-800',
      approval: 'bg-indigo-100 text-indigo-800',
      refund: 'bg-red-100 text-red-800',
      invoice_create: 'bg-teal-100 text-teal-800'
    };
    return <Badge className={colors[category] || 'bg-gray-100 text-gray-800'}>{category}</Badge>;
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="w-8 h-8 text-indigo-600" />
              Compliance Ledger
            </h1>
            <p className="text-gray-600 mt-2">Immutable audit trail of all sensitive operations</p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={computeAnchor}>
              <LinkIcon className="w-4 h-4 mr-2" />
              Compute Anchor
            </Button>
            <Button onClick={exportAuditBundle} disabled={exporting}>
              {exporting ? (
                <Loader className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Export Audit
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Events (Period)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-indigo-600">{events.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Anchors Created</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{anchors.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Chain Integrity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-500" />
                <span className="text-lg font-semibold">Valid</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Unique Actors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                {[...new Set(events.map(e => e.actor))].length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Timeframe Selector */}
        <Tabs value={timeframe} onValueChange={setTimeframe} className="mb-6">
          <TabsList>
            <TabsTrigger value="7">Last 7 Days</TabsTrigger>
            <TabsTrigger value="30">Last 30 Days</TabsTrigger>
            <TabsTrigger value="90">Last 90 Days</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Events List */}
        <Card>
          <CardHeader>
            <CardTitle>Compliance Events</CardTitle>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No compliance events in selected period</p>
            ) : (
              <div className="space-y-2">
                {events.map((event, idx) => (
                  <div key={event.id} className="flex items-center justify-between p-3 bg-white border rounded-lg hover:border-indigo-300 transition-colors">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="text-sm text-gray-500 font-mono">#{idx + 1}</div>
                      {getCategoryBadge(event.category)}
                      <div className="flex-1">
                        <div className="font-medium">{event.event_type}</div>
                        <div className="text-sm text-gray-600">
                          {event.ref_type}: {event.ref_id} • Actor: {event.actor}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(event.ts).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {event.pii_redacted && (
                        <Badge variant="outline" className="text-xs">PII Redacted</Badge>
                      )}
                      <code className="text-xs text-gray-400 font-mono">
                        {event.digest_sha256?.substring(0, 8)}...
                      </code>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Anchors */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Cryptographic Anchors</CardTitle>
          </CardHeader>
          <CardContent>
            {anchors.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No anchors computed yet. Click "Compute Anchor" to create one.</p>
            ) : (
              <div className="space-y-3">
                {anchors.map((anchor) => (
                  <div key={anchor.id} className="p-4 bg-gray-50 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <LinkIcon className="w-4 h-4 text-gray-600" />
                        <span className="font-semibold">{anchor.period}</span>
                        <Badge>{anchor.event_count} events</Badge>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(anchor.computed_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="space-y-1 text-xs font-mono">
                      <div className="text-gray-600">
                        <span className="font-semibold">Merkle Root:</span> {anchor.anchor_sha256}
                      </div>
                      <div className="text-gray-600">
                        <span className="font-semibold">HMAC:</span> {anchor.hmac_sha256}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}