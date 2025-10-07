import React, { useState, useEffect } from 'react';
import { Connection, Credential } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, RefreshCw, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export default function Connections() {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testingConnection, setTestingConnection] = useState(null);

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      const conns = await Connection.list();
      setConnections(conns);
    } catch (error) {
      console.error('Failed to load connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async (connectionId) => {
    setTestingConnection(connectionId);
    // Simulate health check
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await Connection.update(connectionId, {
      status: 'active',
      last_health_check: new Date().toISOString()
    });
    
    loadConnections();
    setTestingConnection(null);
  };

  const deleteConnection = async (connectionId) => {
    if (!confirm('Are you sure? This will break any workflows using this connection.')) {
      return;
    }
    
    await Connection.delete(connectionId);
    loadConnections();
  };

  const getProviderIcon = (provider) => {
    const icons = {
      shopify: '🛍️',
      stripe: '💳',
      xero: '📊',
      gmail: '📧',
      msgraph: '📧',
      slack: '💬'
    };
    return icons[provider] || '🔌';
  };

  const getStatusBadge = (status) => {
    const variants = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      inactive: { color: 'bg-gray-100 text-gray-800', icon: AlertCircle },
      error: { color: 'bg-red-100 text-red-800', icon: AlertCircle },
      expired: { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle }
    };
    
    const variant = variants[status] || variants.inactive;
    const Icon = variant.icon;
    
    return (
      <Badge className={`${variant.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {status}
      </Badge>
    );
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
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Connections</h1>
            <p className="text-gray-600 mt-2">Manage your integration connections</p>
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Connection
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Connection</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Provider</label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2">
                    <option value="shopify">Shopify</option>
                    <option value="stripe">Stripe</option>
                    <option value="xero">Xero</option>
                    <option value="gmail">Gmail</option>
                    <option value="msgraph">Outlook</option>
                    <option value="slack">Slack</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Connection Name</label>
                  <Input placeholder="My Store Connection" />
                </div>
                <Button className="w-full">Connect</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {connections.map((conn) => (
            <Card key={conn.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{getProviderIcon(conn.provider)}</span>
                    <div>
                      <CardTitle className="text-lg">{conn.name}</CardTitle>
                      <p className="text-sm text-gray-600 capitalize">{conn.provider}</p>
                    </div>
                  </div>
                  {getStatusBadge(conn.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {conn.last_health_check && (
                  <div className="text-sm text-gray-600">
                    Last checked: {new Date(conn.last_health_check).toLocaleString()}
                  </div>
                )}

                {conn.error_message && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-800">{conn.error_message}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => testConnection(conn.id)}
                    disabled={testingConnection === conn.id}
                    className="flex items-center gap-2"
                  >
                    {testingConnection === conn.id ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        Test
                      </>
                    )}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-2 text-red-600 hover:text-red-700"
                    onClick={() => deleteConnection(conn.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {connections.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No connections yet. Add your first integration to get started.</p>
            <Dialog>
              <DialogTrigger asChild>
                <Button>Add Connection</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Connection</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <p className="text-sm text-gray-600">Select a provider to connect:</p>
                  <div className="grid grid-cols-2 gap-3">
                    {['shopify', 'stripe', 'xero', 'gmail', 'slack'].map(provider => (
                      <button
                        key={provider}
                        className="p-4 border border-gray-200 rounded-lg hover:border-indigo-500 transition-colors"
                      >
                        <span className="text-3xl mb-2 block">{getProviderIcon(provider)}</span>
                        <span className="text-sm font-medium capitalize">{provider}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
    </div>
  );
}