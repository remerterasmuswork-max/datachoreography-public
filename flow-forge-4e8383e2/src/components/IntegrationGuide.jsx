import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, Code, Key } from 'lucide-react';

export default function IntegrationGuide() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Integration Setup Guide
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Shopify */}
          <div>
            <h3 className="text-lg font-semibold mb-3">1. Shopify Integration</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p><strong>Required Scopes:</strong> read_orders, write_orders, read_inventory, write_inventory</p>
              <p><strong>Setup:</strong></p>
              <ol className="list-decimal ml-6 space-y-1">
                <li>Go to Shopify Admin → Settings → Apps and sales channels → Develop apps</li>
                <li>Create new app: "DataChoreography"</li>
                <li>Configure Admin API scopes (above)</li>
                <li>Install app and copy Access Token</li>
                <li>Configure webhook: orders/create → Your webhook URL</li>
              </ol>
              <p className="mt-2"><strong>Webhook URL:</strong> <code className="bg-gray-100 px-2 py-1 rounded">https://your-app.com/webhooks/shopify</code></p>
            </div>
          </div>

          {/* Stripe */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-3">2. Stripe Integration</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p><strong>API Version:</strong> 2024-06-20</p>
              <p><strong>Setup:</strong></p>
              <ol className="list-decimal ml-6 space-y-1">
                <li>Go to Stripe Dashboard → Developers → API keys</li>
                <li>Copy Secret key (sk_test_... or sk_live_...)</li>
                <li>Go to Webhooks → Add endpoint</li>
                <li>URL: Your webhook URL</li>
                <li>Select events: payment_intent.succeeded, charge.refunded</li>
                <li>Copy Signing secret (whsec_...)</li>
              </ol>
            </div>
          </div>

          {/* Xero */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-3">3. Xero Integration</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p><strong>OAuth 2.0 Required</strong></p>
              <p><strong>Required Scopes:</strong> accounting.transactions, accounting.contacts.read</p>
              <p><strong>Setup:</strong></p>
              <ol className="list-decimal ml-6 space-y-1">
                <li>Go to Xero Developer Portal → My Apps → New App</li>
                <li>Choose "Web app"</li>
                <li>Redirect URI: https://your-app.com/oauth/xero/callback</li>
                <li>Copy Client ID and Client Secret</li>
                <li>Use OAuth flow in DataChoreography to authorize</li>
              </ol>
            </div>
          </div>

          {/* Slack */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-3">4. Slack Integration</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p><strong>Required Scopes:</strong> chat:write, chat:write.public</p>
              <p><strong>Setup:</strong></p>
              <ol className="list-decimal ml-6 space-y-1">
                <li>Go to api.slack.com/apps → Create New App</li>
                <li>Add Bot Token Scopes (above)</li>
                <li>Enable Interactivity → Set Request URL</li>
                <li>Install to Workspace</li>
                <li>Copy Bot User OAuth Token (xoxb-...)</li>
                <li>Copy Signing Secret from Basic Information</li>
              </ol>
            </div>
          </div>

          {/* Environment Variables */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Code className="w-5 h-5" />
              Required Environment Variables
            </h3>
            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-xs space-y-1">
              <div># Shopify</div>
              <div>SHOPIFY_WEBHOOK_SECRET=your_secret</div>
              <div>SHOPIFY_SHOP_DOMAIN=your-store.myshopify.com</div>
              <div className="mt-2"># Stripe</div>
              <div>STRIPE_SECRET_KEY=sk_live_...</div>
              <div>STRIPE_WEBHOOK_SECRET=whsec_...</div>
              <div className="mt-2"># Xero</div>
              <div>XERO_CLIENT_ID=...</div>
              <div>XERO_CLIENT_SECRET=...</div>
              <div className="mt-2"># Slack</div>
              <div>SLACK_BOT_TOKEN=xoxb-...</div>
              <div>SLACK_SIGNING_SECRET=...</div>
              <div>SLACK_APPROVALS_CHANNEL=C01234567</div>
            </div>
          </div>

          <div className="border-t pt-4">
            <a 
              href="https://docs.base44.com/integrations" 
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700"
            >
              <ExternalLink className="w-4 h-4" />
              View Full Documentation
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}