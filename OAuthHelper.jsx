import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import TenantEntity from '../components/TenantEntity';
import { Connection, Credential } from '@/api/entities';
import { encryptCredential } from '../components/EncryptionVault';
import { Copy, ExternalLink, CheckCircle, Loader } from 'lucide-react';

export default function OAuthHelper() {
  const [provider, setProvider] = useState('shopify');
  const [code, setCode] = useState('');
  const [state, setState] = useState('');
  const [token, setToken] = useState('');
  const [connectionName, setConnectionName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [step, setStep] = useState(1); // 1: authorize, 2: paste code, 3: success

  useEffect(() => {
    // Check URL params for OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const urlCode = urlParams.get('code');
    const urlState = urlParams.get('state');
    const urlProvider = urlParams.get('provider');
    
    if (urlCode) {
      setCode(urlCode);
      setState(urlState || '');
      if (urlProvider) setProvider(urlProvider);
      setStep(2);
    }
  }, []);

  const providerConfigs = {
    shopify: {
      name: 'Shopify',
      icon: '🛍️',
      authUrl: (shop) => `https://${shop}/admin/oauth/authorize?client_id=YOUR_CLIENT_ID&scope=read_orders,write_orders&redirect_uri=YOUR_REDIRECT_URI`,
      tokenFields: ['shop_domain', 'access_token'],
      instructions: [
        '1. Go to your Shopify Admin → Settings → Apps',
        '2. Click "Develop apps" → "Create an app"',
        '3. Name it "DataChoreography" and set scopes',
        '4. Install app and copy Admin API access token',
        '5. Paste token below'
      ]
    },
    stripe: {
      name: 'Stripe',
      icon: '💳',
      tokenFields: ['secret_key'],
      instructions: [
        '1. Go to Stripe Dashboard → Developers → API keys',
        '2. Copy your Secret key (sk_test_ or sk_live_)',
        '3. Paste below'
      ]
    },
    xero: {
      name: 'Xero',
      icon: '📊',
      authUrl: 'https://login.xero.com/identity/connect/authorize?...',
      tokenFields: ['access_token', 'refresh_token', 'tenant_id'],
      instructions: [
        '1. Go to developer.xero.com → My Apps → Create app',
        '2. Set redirect URI',
        '3. Complete OAuth flow',
        '4. Paste access token and tenant ID below'
      ]
    },
    gmail: {
      name: 'Gmail',
      icon: '📧',
      tokenFields: ['refresh_token', 'client_id', 'client_secret'],
      instructions: [
        '1. Google Cloud Console → Enable Gmail API',
        '2. Create OAuth 2.0 credentials',
        '3. Complete OAuth flow',
        '4. Paste refresh token below'
      ]
    },
    slack: {
      name: 'Slack',
      icon: '💬',
      authUrl: 'https://slack.com/oauth/v2/authorize?...',
      tokenFields: ['bot_token', 'signing_secret'],
      instructions: [
        '1. api.slack.com/apps → Create New App',
        '2. Add bot scopes: chat:write',
        '3. Install to workspace',
        '4. Copy Bot User OAuth Token'
      ]
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const TenantConnection = TenantEntity.wrap(Connection);
      const TenantCredential = TenantEntity.wrap(Credential);
      
      // Create connection
      const connection = await TenantConnection.create({
        provider,
        name: connectionName || `${providerConfigs[provider].name} Connection`,
        status: 'active',
        config: {
          created_via: 'oauth_helper',
          created_at: new Date().toISOString()
        }
      });
      
      // Encrypt and store credential
      const encrypted = await encryptCredential(token);
      
      await TenantCredential.create({
        connection_id: connection.id,
        encrypted_value: encrypted,
        credential_type: provider === 'stripe' ? 'api_key' : 'oauth_token',
        rotation_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
      });
      
      setSaved(true);
      setStep(3);
      
      // Redirect after 2 seconds
      setTimeout(() => {
        window.location.href = '/Connections';
      }, 2000);
      
    } catch (error) {
      alert('Error saving connection: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const currentProvider = providerConfigs[provider];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-3xl">{currentProvider.icon}</span>
                  Connect {currentProvider.name}
                </CardTitle>
                <p className="text-sm text-gray-600 mt-2">
                  Step {step} of 3: {step === 1 ? 'Choose Provider' : step === 2 ? 'Enter Credentials' : 'Success!'}
                </p>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Provider Selector */}
            {step === 1 && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(providerConfigs).map(([key, info]) => (
                    <button
                      key={key}
                      onClick={() => setProvider(key)}
                      className={`p-4 border-2 rounded-lg transition-all hover:shadow-md ${
                        provider === key
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-4xl mb-2">{info.icon}</div>
                      <div className="font-medium">{info.name}</div>
                    </button>
                  ))}
                </div>

                <Button onClick={() => setStep(2)} className="w-full">
                  Continue with {currentProvider.name}
                </Button>
              </>
            )}

            {/* Instructions & Token Input */}
            {step === 2 && (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    {currentProvider.icon} Setup Instructions
                    {currentProvider.authUrl && (
                      <a
                        href={typeof currentProvider.authUrl === 'string' ? currentProvider.authUrl : '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline flex items-center gap-1 ml-auto"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Open
                      </a>
                    )}
                  </h3>
                  <ol className="text-sm text-blue-800 space-y-1">
                    {currentProvider.instructions.map((instruction, idx) => (
                      <li key={idx}>{instruction}</li>
                    ))}
                  </ol>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Connection Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={connectionName}
                    onChange={(e) => setConnectionName(e.target.value)}
                    placeholder={`My ${currentProvider.name} Connection`}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Paste Token/Credentials
                  </label>
                  <Textarea
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder={`Enter your ${currentProvider.name} credentials...`}
                    rows={6}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Required fields: {currentProvider.tokenFields.join(', ')}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    disabled={saving}
                  >
                    ← Back
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={!token || saving}
                    className="flex-1"
                  >
                    {saving ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Connection'
                    )}
                  </Button>
                </div>
              </>
            )}

            {/* Success */}
            {step === 3 && (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Connection Saved!
                </h3>
                <p className="text-gray-600 mb-6">
                  Your {currentProvider.name} connection has been encrypted and stored securely.
                </p>
                <Button onClick={() => window.location.href = '/Connections'}>
                  Go to Connections
                </Button>
              </div>
            )}

            {/* Security Note */}
            {step === 2 && (
              <div className="border-t pt-4">
                <p className="text-xs text-gray-600">
                  🔒 <strong>Security:</strong> Your credentials are encrypted using AES-256-GCM before storage. 
                  They are never transmitted to external servers.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Technical Note */}
        {step === 2 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-sm">For Developers</CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-2">
              <p>
                <strong>Manual OAuth Flow:</strong> Since Base44 may not support OAuth callbacks directly,
                this helper guides you through manual token setup.
              </p>
              <p>
                <strong>Future Enhancement:</strong> Deploy an OAuth relay service at{' '}
                <code className="bg-gray-100 px-1 py-0.5 rounded">oauth.datachor.com</code>{' '}
                to handle the full OAuth flow automatically.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}