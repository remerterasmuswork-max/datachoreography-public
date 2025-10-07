import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Server, 
  Layout, 
  TestTube, 
  Rocket, 
  Map,
  CheckCircle,
  AlertCircle,
  Code,
  Database,
  Shield,
  Zap
} from 'lucide-react';

export default function DeveloperHandoff() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">DataChoreography Developer Handoff</h1>
          <p className="text-xl text-gray-600">Complete technical documentation for seamless project continuation</p>
          <div className="flex gap-2 mt-4">
            <Badge className="bg-green-600">v0.1.0-alpha</Badge>
            <Badge variant="outline">Last Updated: Jan 2025</Badge>
            <Badge variant="outline">Status: MVP → Beta Prep</Badge>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">
              <FileText className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="backend">
              <Server className="w-4 h-4 mr-2" />
              Backend
            </TabsTrigger>
            <TabsTrigger value="frontend">
              <Layout className="w-4 h-4 mr-2" />
              Frontend
            </TabsTrigger>
            <TabsTrigger value="testing">
              <TestTube className="w-4 h-4 mr-2" />
              Testing
            </TabsTrigger>
            <TabsTrigger value="deployment">
              <Rocket className="w-4 h-4 mr-2" />
              Deployment
            </TabsTrigger>
            <TabsTrigger value="roadmap">
              <Map className="w-4 h-4 mr-2" />
              Roadmap
            </TabsTrigger>
          </TabsList>

          {/* ===== OVERVIEW TAB ===== */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-6 h-6 text-indigo-600" />
                  What Is DataChoreography?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Business Problem</h3>
                  <p className="text-gray-700">
                    SMBs waste 15-30 hours/week on repetitive data choreography between SaaS tools (Shopify → Xero, 
                    Stripe → accounting, refunds, AR chasing, invoice reconciliation). Zapier is too simplistic for 
                    complex workflows with approval gates, GDPR compliance, and financial controls.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-2">Solution</h3>
                  <p className="text-gray-700 mb-3">
                    <strong>DataChoreography</strong> is a marketplace-driven automation OS that lets non-technical users:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700">
                    <li>Install pre-built workflow templates (Order-to-Cash, Smart Refunds, AR Chaser, etc.)</li>
                    <li>Visually compose custom automations with approval gates and conditional logic</li>
                    <li>Connect Shopify, Stripe, Xero, email, Slack with OAuth2 credential vault</li>
                    <li>Track business value: hours saved, revenue processed, error-free rate</li>
                    <li>Maintain SOC2/GDPR compliance with audit trails and crypto-shredding</li>
                  </ul>
                </div>

                <div className="bg-indigo-50 border-2 border-indigo-200 rounded-lg p-4">
                  <h3 className="font-semibold text-indigo-900 mb-2">🎯 Core Value Prop</h3>
                  <p className="text-indigo-800">
                    "Zapier for financial workflows, but with enterprise-grade approvals, compliance, and a curated marketplace."
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Current Project State</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      ✅ Production-Ready
                    </h3>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li>• Multi-tenant data model with RLS</li>
                      <li>• JWT auth + refresh tokens</li>
                      <li>• Credential vault with AES-256-GCM encryption</li>
                      <li>• Compliance event chain with SHA-256 anchors</li>
                      <li>• Idempotency middleware</li>
                      <li>• Workflow entity schema (Workflow, WorkflowStep, Run, Approval)</li>
                      <li>• Frontend marketplace UI + template browser</li>
                      <li>• Visual workflow composer (React components)</li>
                      <li>• Business metrics dashboard</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-yellow-600" />
                      ⚠️ MVP / Needs Work
                    </h3>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li>• Workflow execution engine (polling, retries, circuit breakers)</li>
                      <li>• Real OAuth2 flows for Shopify/Stripe/Xero</li>
                      <li>• Actual API integrations (currently mocked)</li>
                      <li>• Approval notification system (email/Slack)</li>
                      <li>• Publisher review queue UI</li>
                      <li>• GDPR crypto-shredding automation</li>
                      <li>• Metrics aggregation job (daily rollups)</li>
                      <li>• Load testing + performance optimization</li>
                      <li>• Comprehensive test suite</li>
                      <li>• CI/CD pipeline</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Technology Stack</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Backend</h4>
                    <ul className="text-sm space-y-1 text-gray-700">
                      <li>• Node.js 20+ / TypeScript</li>
                      <li>• Fastify (Express alternative)</li>
                      <li>• PostgreSQL 15+</li>
                      <li>• Drizzle ORM</li>
                      <li>• Redis (sessions, locks)</li>
                      <li>• Docker + Docker Compose</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Frontend</h4>
                    <ul className="text-sm space-y-1 text-gray-700">
                      <li>• React 18</li>
                      <li>• shadcn/ui components</li>
                      <li>• TailwindCSS</li>
                      <li>• Framer Motion</li>
                      <li>• React Router</li>
                      <li>• base44 entity SDK</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Infrastructure</h4>
                    <ul className="text-sm space-y-1 text-gray-700">
                      <li>• AWS/GCP (TBD)</li>
                      <li>• RDS PostgreSQL</li>
                      <li>• ElastiCache Redis</li>
                      <li>• Secrets Manager</li>
                      <li>• CloudWatch/Datadog</li>
                      <li>• GitHub Actions</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== BACKEND TAB ===== */}
          <TabsContent value="backend" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-6 h-6 text-indigo-600" />
                  Backend Architecture
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">Core Design Principles</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border-l-4 border-indigo-500 pl-4">
                      <h4 className="font-semibold text-indigo-900">Multi-Tenant by Default</h4>
                      <p className="text-sm text-gray-700">
                        Every table has <code className="bg-gray-100 px-1 rounded">tenant_id</code>. 
                        RLS middleware enforces isolation at query time.
                      </p>
                    </div>
                    <div className="border-l-4 border-green-500 pl-4">
                      <h4 className="font-semibold text-green-900">Security First</h4>
                      <p className="text-sm text-gray-700">
                        Credentials encrypted at rest (AES-256-GCM), JWTs for auth, 
                        compliance events for audit trail.
                      </p>
                    </div>
                    <div className="border-l-4 border-purple-500 pl-4">
                      <h4 className="font-semibold text-purple-900">Idempotent Everything</h4>
                      <p className="text-sm text-gray-700">
                        All workflow runs use unique <code className="bg-gray-100 px-1 rounded">idempotency_key</code> 
                        to prevent duplicate execution.
                      </p>
                    </div>
                    <div className="border-l-4 border-orange-500 pl-4">
                      <h4 className="font-semibold text-orange-900">Compliance Native</h4>
                      <p className="text-sm text-gray-700">
                        Every sensitive operation logged to <code className="bg-gray-100 px-1 rounded">compliance_events</code> 
                        with SHA-256 chain integrity.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Database Schema (PostgreSQL)</h3>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs font-mono overflow-x-auto">
                    <pre>{`┌─────────────────────────────────────────────────────────────┐
│                      Core Schema                            │
├─────────────────────────────────────────────────────────────┤
│ tenants                 # Organization records              │
│ users                   # User accounts (email, role)       │
│ connections             # OAuth2 credentials (Stripe, etc.) │
│ credentials             # Encrypted API keys/tokens         │
│ workflows               # Workflow definitions              │
│ workflow_steps          # Step configurations               │
│ runs                    # Execution instances               │
│ run_logs                # Detailed execution logs           │
│                                                              │
│                  Marketplace & Templates                    │
├─────────────────────────────────────────────────────────────┤
│ marketplace_templates   # Curated workflow templates       │
│ template_installations  # Per-tenant installs              │
│ publisher_submissions   # Template review queue            │
│                                                              │
│                  Compliance & GDPR                          │
├─────────────────────────────────────────────────────────────┤
│ compliance_events       # Audit trail (SHA-256 chain)      │
│ compliance_anchors      # Merkle roots per period          │
│ gdpr_data_subjects      # PII tracking + consent           │
│ encryption_keys         # Key rotation metadata            │
│                                                              │
│                  Approvals & Metrics                        │
├─────────────────────────────────────────────────────────────┤
│ approval_workflows      # Manual approval gates            │
│ metric_aggregations     # Daily/weekly rollups             │
│ metric_events           # Real-time metric points          │
└─────────────────────────────────────────────────────────────┘`}</pre>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">API Endpoints</h3>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-mono text-sm bg-green-100 text-green-900 inline-block px-2 py-1 rounded">
                        ✅ Implemented
                      </h4>
                      <ul className="mt-2 space-y-1 text-sm text-gray-700">
                        <li><code className="bg-gray-100 px-2 py-1 rounded">POST /api/auth/login</code> - JWT issuance</li>
                        <li><code className="bg-gray-100 px-2 py-1 rounded">POST /api/auth/refresh</code> - Token refresh</li>
                        <li><code className="bg-gray-100 px-2 py-1 rounded">GET /api/tenants</code> - List tenants (admin)</li>
                        <li><code className="bg-gray-100 px-2 py-1 rounded">GET /api/workflows</code> - List workflows (RLS filtered)</li>
                        <li><code className="bg-gray-100 px-2 py-1 rounded">POST /api/workflows</code> - Create workflow</li>
                        <li><code className="bg-gray-100 px-2 py-1 rounded">POST /api/credentials</code> - Store encrypted credentials</li>
                        <li><code className="bg-gray-100 px-2 py-1 rounded">POST /api/credentials/execute</code> - Execute with credentials</li>
                        <li><code className="bg-gray-100 px-2 py-1 rounded">GET /api/marketplace/templates</code> - Browse templates</li>
                        <li><code className="bg-gray-100 px-2 py-1 rounded">POST /api/marketplace/templates/:id/install</code> - Install template</li>
                        <li><code className="bg-gray-100 px-2 py-1 rounded">POST /api/publisher/submit</code> - Submit template for review</li>
                        <li><code className="bg-gray-100 px-2 py-1 rounded">GET /api/metrics/dashboard</code> - Business metrics</li>
                        <li><code className="bg-gray-100 px-2 py-1 rounded">POST /api/gdpr/subjects/:hash/erase</code> - Right to erasure</li>
                        <li><code className="bg-gray-100 px-2 py-1 rounded">GET /api/approvals/pending</code> - Pending approvals</li>
                        <li><code className="bg-gray-100 px-2 py-1 rounded">POST /api/approvals/:id/approve</code> - Approve workflow step</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-mono text-sm bg-yellow-100 text-yellow-900 inline-block px-2 py-1 rounded">
                        ⚠️ Needs Implementation
                      </h4>
                      <ul className="mt-2 space-y-1 text-sm text-gray-700">
                        <li><code className="bg-gray-100 px-2 py-1 rounded">POST /api/workflows/:id/execute</code> - Trigger manual run</li>
                        <li><code className="bg-gray-100 px-2 py-1 rounded">GET /api/runs/:id/logs</code> - Stream execution logs</li>
                        <li><code className="bg-gray-100 px-2 py-1 rounded">POST /api/connections/oauth/initiate</code> - OAuth2 flow</li>
                        <li><code className="bg-gray-100 px-2 py-1 rounded">GET /api/connections/oauth/callback</code> - OAuth2 callback</li>
                        <li><code className="bg-gray-100 px-2 py-1 rounded">POST /api/integrations/shopify/orders</code> - Shopify proxy</li>
                        <li><code className="bg-gray-100 px-2 py-1 rounded">POST /api/integrations/stripe/charges</code> - Stripe proxy</li>
                        <li><code className="bg-gray-100 px-2 py-1 rounded">POST /api/integrations/xero/invoices</code> - Xero proxy</li>
                        <li><code className="bg-gray-100 px-2 py-1 rounded">POST /api/webhooks/shopify</code> - Webhook receiver</li>
                        <li><code className="bg-gray-100 px-2 py-1 rounded">POST /api/webhooks/stripe</code> - Webhook receiver</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Local Setup Instructions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm">
                  <pre>{`# Clone repository
git clone https://github.com/your-org/datachoreography.git
cd datachoreography/backend

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your values (see below)

# Start PostgreSQL + Redis via Docker
docker-compose up -d

# Run migrations
npm run migrate

# Seed demo data
npm run seed

# Start development server
npm run dev

# Server should be running on http://localhost:3000
# API documentation: http://localhost:3000/docs`}</pre>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Required Environment Variables</h3>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 font-mono text-sm">
                    <pre>{`# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/datachoreography
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=<generate_with_openssl_rand_hex_64>
JWT_REFRESH_SECRET=<generate_with_openssl_rand_hex_64>
ENCRYPTION_MASTER_KEY=<generate_with_openssl_rand_hex_32>

# App
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:3001

# Optional: External Services
SHOPIFY_CLIENT_ID=
SHOPIFY_CLIENT_SECRET=
STRIPE_CLIENT_ID=
STRIPE_CLIENT_SECRET=
XERO_CLIENT_ID=
XERO_CLIENT_SECRET=`}</pre>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-6 h-6 text-red-600" />
                  Critical Security Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                    <h4 className="font-semibold text-red-900 mb-2">🔒 Credential Vault</h4>
                    <ul className="text-sm text-red-800 space-y-1">
                      <li>• All credentials encrypted with AES-256-GCM before storage</li>
                      <li>• Master key stored in environment variable (production: AWS Secrets Manager)</li>
                      <li>• Each credential gets unique IV (initialization vector)</li>
                      <li>• Encryption format: <code className="bg-red-100 px-1 rounded">IV:TAG:CIPHERTEXT</code></li>
                      <li>• Key rotation supported via <code className="bg-red-100 px-1 rounded">encryption_keys</code> table</li>
                      <li>• NEVER log decrypted credentials</li>
                    </ul>
                  </div>

                  <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                    <h4 className="font-semibold text-yellow-900 mb-2">⚠️ Tenant Isolation (RLS)</h4>
                    <ul className="text-sm text-yellow-800 space-y-1">
                      <li>• <code className="bg-yellow-100 px-1 rounded">rlsMiddleware</code> MUST run after <code className="bg-yellow-100 px-1 rounded">authMiddleware</code></li>
                      <li>• Injects <code className="bg-yellow-100 px-1 rounded">tenantId</code> into every query automatically</li>
                      <li>• Uses Drizzle's <code className="bg-yellow-100 px-1 rounded">.where(eq(table.tenantId, ctx.tenantId))</code></li>
                      <li>• Test tenant isolation thoroughly before multi-tenant deployment</li>
                      <li>• Admin users can bypass RLS (handle with care)</li>
                    </ul>
                  </div>

                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">📋 Compliance Audit Trail</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Every sensitive operation logged to <code className="bg-blue-100 px-1 rounded">compliance_events</code></li>
                      <li>• Events form an append-only chain with SHA-256 hashing</li>
                      <li>• Each event includes: <code className="bg-blue-100 px-1 rounded">digest_sha256</code>, <code className="bg-blue-100 px-1 rounded">prev_digest_sha256</code></li>
                      <li>• Merkle anchors computed daily for tamper detection</li>
                      <li>• PII automatically redacted before logging</li>
                      <li>• Retention: 7 years (2555 days) for financial records</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Backend Refactor Checklist</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { done: false, task: 'Implement workflow execution engine with polling + retries', priority: 'P0' },
                    { done: false, task: 'Add OAuth2 flows for Shopify, Stripe, Xero', priority: 'P0' },
                    { done: false, task: 'Build integration proxies (shopify/orders, stripe/charges, xero/invoices)', priority: 'P0' },
                    { done: false, task: 'Webhook receivers with signature verification', priority: 'P0' },
                    { done: false, task: 'Approval notification system (email + Slack)', priority: 'P1' },
                    { done: false, task: 'Metrics aggregation cron job (daily rollups)', priority: 'P1' },
                    { done: false, task: 'GDPR crypto-shredding automation', priority: 'P1' },
                    { done: false, task: 'Circuit breakers + graceful degradation', priority: 'P1' },
                    { done: false, task: 'Rate limiting per tenant', priority: 'P2' },
                    { done: false, task: 'Comprehensive test suite (unit + integration)', priority: 'P0' },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      {item.done ? (
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{item.task}</p>
                      </div>
                      <Badge className={
                        item.priority === 'P0' ? 'bg-red-600' :
                        item.priority === 'P1' ? 'bg-orange-600' :
                        'bg-blue-600'
                      }>
                        {item.priority}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== FRONTEND TAB ===== */}
          <TabsContent value="frontend" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layout className="w-6 h-6 text-indigo-600" />
                  Frontend Architecture
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">Page Structure</h3>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-xs">
                    <pre>{`pages/
├── AutomationHome.js       # Business-value dashboard (hours saved, revenue, etc.)
├── Marketplace.js          # Browse workflow templates by category
├── WorkflowLibrary.js      # Alt marketplace view with filters
├── WorkflowComposer.js     # Visual workflow builder (drag & drop blocks)
├── WorkflowDetail.js       # Edit existing workflow
├── Onboarding.js           # First-time setup wizard (5-min TTFR)
├── ActionCenter.js         # Pending approvals + failed runs
├── Insights.js             # ROI analytics & trend charts
├── Workflows.js            # List all workflows (enable/disable/configure)
├── Connections.js          # Manage OAuth2 connections
├── Runs.js                 # Execution history
├── RunDetail.js            # Single run logs + context
├── Approvals.js            # Approval queue
├── PublisherConsole.js     # Submit templates for marketplace
├── Settings.js             # Tenant settings + GDPR controls
└── [35+ more pages...]     # Backend code viewers, test pages, etc.

components/
├── marketplace/
│   ├── TemplateCard.jsx            # Template preview card
│   ├── TemplateDetails.jsx         # Full template manifest viewer
│   ├── InstallWizard.jsx           # Multi-step install flow
│   └── marketplaceTemplates.js     # Template manifest data (10 templates)
├── workflows/
│   ├── TriggerBlock.jsx            # Workflow trigger selector
│   ├── ActionBlock.jsx             # Workflow step component
│   └── ConnectionPicker.jsx        # Service connection selector
├── automation/
│   ├── BusinessMetricCard.jsx      # KPI tile component
│   ├── AgentCard.jsx               # Agent status card
│   └── RunTimeline.jsx             # Execution timeline viz
├── gdpr/
│   ├── PIIBadge.jsx                # PII indicator badge
│   ├── DataMapViewer.jsx           # GDPR data flow viewer
│   └── RightToErasure.jsx          # Crypto-shredding UI
└── [30+ more components...]`}</pre>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Key Frontend Features</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border-2 border-green-200 bg-green-50 rounded-lg p-4">
                      <h4 className="font-semibold text-green-900 mb-2">✅ Fully Implemented</h4>
                      <ul className="text-sm text-green-800 space-y-1">
                        <li>• Marketplace browsing + search/filter</li>
                        <li>• Template installation wizard</li>
                        <li>• Visual workflow composer</li>
                        <li>• Business metrics dashboard</li>
                        <li>• Onboarding flow (industry → templates → connect → deploy)</li>
                        <li>• GDPR data subject viewer</li>
                        <li>• Approval action center</li>
                        <li>• Run history + logs</li>
                      </ul>
                    </div>

                    <div className="border-2 border-yellow-200 bg-yellow-50 rounded-lg p-4">
                      <h4 className="font-semibold text-yellow-900 mb-2">⚠️ Needs Backend Connection</h4>
                      <ul className="text-sm text-yellow-800 space-y-1">
                        <li>• Real-time run status updates (WebSocket)</li>
                        <li>• OAuth2 connection flow</li>
                        <li>• Actual workflow execution</li>
                        <li>• Publisher review queue</li>
                        <li>• Metrics trend charts (recharts integration)</li>
                        <li>• GDPR export/erasure triggers</li>
                        <li>• Approval notifications</li>
                        <li>• Test run functionality</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-lg mb-3">Connecting Frontend to Backend</h3>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm">
                    <pre>{`// Current: Using base44 entity SDK (abstraction layer)
import { Workflow, Run, Connection } from '@/api/entities';

// Example usage:
const workflows = await Workflow.list();
const run = await Run.create({ workflow_id: '...' });

// To connect to your backend:
// Option 1: Update base44 SDK to point to your API
// Option 2: Replace entity calls with direct fetch() to your backend
// Option 3: Create an API adapter layer

// Example adapter:
class APIClient {
  constructor(baseURL, token) {
    this.baseURL = baseURL;
    this.token = token;
  }

  async get(endpoint) {
    const res = await fetch(\`\${this.baseURL}\${endpoint}\`, {
      headers: { 'Authorization': \`Bearer \${this.token}\` }
    });
    return res.json();
  }
}

// Usage:
const api = new APIClient('http://localhost:3000/api', jwt);
const workflows = await api.get('/workflows');`}</pre>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Frontend Setup Instructions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm">
                  <pre>{`# Frontend is currently embedded in base44 platform
# For standalone deployment:

# 1. Extract frontend code from base44
mkdir datachoreography-frontend
cd datachoreography-frontend

# 2. Initialize React app
npx create-react-app . --template typescript
# OR use Vite for faster builds:
npm create vite@latest . -- --template react-ts

# 3. Install dependencies
npm install \
  react-router-dom \
  @radix-ui/react-* \
  tailwindcss \
  framer-motion \
  lucide-react \
  date-fns \
  recharts

# 4. Copy pages/ and components/ from base44 project

# 5. Create API client wrapper
# See APIClient example above

# 6. Update environment
echo "REACT_APP_API_URL=http://localhost:3000" > .env

# 7. Run development server
npm run dev`}</pre>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>UI/UX Polish Checklist</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { done: true, task: 'Responsive design (mobile, tablet, desktop)' },
                    { done: true, task: 'Loading states + skeletons' },
                    { done: true, task: 'Error boundaries + fallbacks' },
                    { done: false, task: 'Empty states with CTAs' },
                    { done: false, task: 'Toast notifications for actions' },
                    { done: false, task: 'Confirmation modals for destructive actions' },
                    { done: false, task: 'Keyboard shortcuts' },
                    { done: false, task: 'Accessibility audit (WCAG 2.1 AA)' },
                    { done: false, task: 'Dark mode support' },
                    { done: false, task: 'Internationalization (i18n)' },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      {item.done ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-gray-400" />
                      )}
                      <p className="text-sm text-gray-900">{item.task}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== TESTING TAB ===== */}
          <TabsContent value="testing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TestTube className="w-6 h-6 text-indigo-600" />
                  Testing Strategy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Test Suite Structure</h3>
                    <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-xs">
                      <pre>{`backend/
├── tests/
│   ├── unit/
│   │   ├── security/
│   │   │   ├── encryption.test.ts       # AES-256-GCM vault
│   │   │   ├── jwt.test.ts              # Token generation
│   │   │   └── hash.test.ts             # SHA-256 integrity
│   │   ├── middleware/
│   │   │   ├── rls.test.ts              # Tenant isolation
│   │   │   └── idempotency.test.ts      # Duplicate prevention
│   │   └── lib/
│   │       ├── compliance.test.ts       # Event chain
│   │       └── gdpr.test.ts             # PII redaction
│   ├── integration/
│   │   ├── auth.test.ts                 # Login/refresh flow
│   │   ├── workflows.test.ts            # CRUD operations
│   │   ├── marketplace.test.ts          # Template install
│   │   └── approvals.test.ts            # Approval workflow
│   └── e2e/
│       ├── onboarding.test.ts           # 5-min TTFR
│       ├── workflow-execution.test.ts   # End-to-end run
│       └── tenant-isolation.test.ts     # Security boundary

# Run tests
npm run test              # All tests
npm run test:unit         # Unit only
npm run test:integration  # Integration only
npm run test:e2e          # E2E only
npm run test:coverage     # Coverage report`}</pre>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-3">"Break It On Purpose" Security Checklist</h3>
                    <div className="space-y-3">
                      {[
                        { test: 'Tenant A tries to access Tenant B\'s workflows', endpoint: 'GET /api/workflows?tenant_id=B', expected: '403 Forbidden' },
                        { test: 'Invalid JWT token', endpoint: 'GET /api/workflows', expected: '401 Unauthorized' },
                        { test: 'Expired JWT token', endpoint: 'GET /api/workflows', expected: '401 Unauthorized' },
                        { test: 'SQL injection in workflow name', endpoint: 'POST /api/workflows', expected: 'Sanitized by Drizzle' },
                        { test: 'Decrypt credential without proper key', endpoint: 'POST /api/credentials/execute', expected: 'Decryption fails' },
                        { test: 'Duplicate workflow run with same idempotency key', endpoint: 'POST /api/workflows/:id/execute', expected: 'Returns existing run ID' },
                        { test: 'GDPR erasure without confirmation', endpoint: 'POST /api/gdpr/subjects/:hash/erase', expected: '400 Bad Request' },
                        { test: 'Approve workflow step as non-authorized user', endpoint: 'POST /api/approvals/:id/approve', expected: '403 Forbidden' },
                        { test: 'XSS in workflow description', endpoint: 'POST /api/workflows', expected: 'Sanitized before render' },
                        { test: 'Rate limit bypass', endpoint: 'GET /api/workflows (1000 requests)', expected: '429 Too Many Requests' },
                      ].map((item, idx) => (
                        <div key={idx} className="border-l-4 border-red-500 bg-red-50 p-3 rounded-r-lg">
                          <p className="font-semibold text-red-900 text-sm">{item.test}</p>
                          <p className="text-xs text-red-700 mt-1">
                            <code className="bg-red-100 px-1 rounded">{item.endpoint}</code>
                          </p>
                          <p className="text-xs text-red-700 mt-1">
                            Expected: <strong>{item.expected}</strong>
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-lg mb-3">Performance Testing</h3>
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 mb-2">Load Test Scenarios</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• 100 concurrent users browsing marketplace</li>
                        <li>• 50 concurrent workflow executions</li>
                        <li>• 1000 webhook deliveries per minute</li>
                        <li>• 10 tenants each running 20 workflows simultaneously</li>
                        <li>• Database connection pool exhaustion test</li>
                        <li>• Redis cache failure simulation</li>
                      </ul>
                      <div className="mt-3 bg-blue-100 p-2 rounded font-mono text-xs">
                        <pre>{`# Using k6 or Apache JMeter
k6 run --vus 100 --duration 5m load-test.js`}</pre>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>GDPR Compliance Verification</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-l-4 border-purple-500 bg-purple-50 p-4 rounded-r-lg">
                    <h4 className="font-semibold text-purple-900 mb-2">Test: Right to Access</h4>
                    <pre className="text-xs font-mono bg-purple-100 p-2 rounded mt-2 overflow-x-auto">
{`GET /api/gdpr/subjects/abc123hash/export

Response should include:
- All workflow runs involving this email
- Consent records
- PII fields processed
- Retention period
- Data processing purpose

Verify PII is NOT redacted in export`}
                    </pre>
                  </div>

                  <div className="border-l-4 border-purple-500 bg-purple-50 p-4 rounded-r-lg">
                    <h4 className="font-semibold text-purple-900 mb-2">Test: Right to Erasure</h4>
                    <pre className="text-xs font-mono bg-purple-100 p-2 rounded mt-2 overflow-x-auto">
{`POST /api/gdpr/subjects/abc123hash/erase
Body: { "confirmation": "DELETE ALL DATA" }

Expected actions:
1. Mark encryption keys as 'shredded'
2. Redact PII in all workflow runs
3. Update gdpr_data_subjects.email to '[REDACTED]'
4. Set erasure_completed_at timestamp
5. Log compliance event

Verify data is truly unrecoverable`}
                    </pre>
                  </div>

                  <div className="border-l-4 border-purple-500 bg-purple-50 p-4 rounded-r-lg">
                    <h4 className="font-semibold text-purple-900 mb-2">Test: Consent Management</h4>
                    <pre className="text-xs font-mono bg-purple-100 p-2 rounded mt-2 overflow-x-auto">
{`POST /api/gdpr/subjects
Body: {
  "email": "test@example.com",
  "consent_given": true,
  "processing_purpose": "Order processing"
}

Verify:
- Consent timestamp recorded
- Purpose clearly stated
- Can be revoked at any time`}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== DEPLOYMENT TAB ===== */}
          <TabsContent value="deployment" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Rocket className="w-6 h-6 text-indigo-600" />
                  Deployment Architecture
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-xs">
                  <pre>{`┌─────────────────────────────────────────────────────────┐
│                  Production Architecture                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [GitHub Actions] ──> [Docker Build] ──> [ECR/GCR]     │
│         │                                               │
│         └──> [Deploy]                                   │
│                  │                                      │
│                  ▼                                      │
│         ┌──────────────────┐                           │
│         │   Load Balancer  │                           │
│         │   (ALB/NGINX)    │                           │
│         └────────┬─────────┘                           │
│                  │                                      │
│         ┌────────┴─────────┐                           │
│         │                  │                           │
│    ┌────▼─────┐      ┌────▼─────┐                     │
│    │ Backend  │      │ Backend  │  (Auto-scaling)     │
│    │ Node.js  │      │ Node.js  │                     │
│    └────┬─────┘      └────┬─────┘                     │
│         │                  │                           │
│         └────────┬─────────┘                           │
│                  │                                      │
│         ┌────────┴─────────┐                           │
│         │                  │                           │
│    ┌────▼──────┐     ┌────▼────────┐                  │
│    │PostgreSQL │     │Redis Cluster│                  │
│    │  (RDS)    │     │(ElastiCache)│                  │
│    └───────────┘     └─────────────┘                  │
│                                                         │
│    ┌────────────┐    ┌─────────────┐                  │
│    │  Secrets   │    │  CloudWatch │                  │
│    │  Manager   │    │   Datadog   │                  │
│    └────────────┘    └─────────────┘                  │
└─────────────────────────────────────────────────────────┘`}</pre>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Docker Setup</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Dockerfile (Backend)</h4>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-xs">
                    <pre>{`FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

EXPOSE 3000

CMD ["node", "dist/index.js"]`}</pre>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">docker-compose.yml (Development)</h4>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-xs">
                    <pre>{`version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: datachoreography
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/datachoreography
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis

volumes:
  postgres_data:`}</pre>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>CI/CD Pipeline (GitHub Actions)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-xs overflow-x-auto">
                  <pre>{`# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test
      - run: npm run lint

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: docker/login-action@v2
        with:
          registry: ghcr.io
          username: \${{ github.actor }}
          password: \${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v4
        with:
          push: true
          tags: ghcr.io/\${{ github.repository }}:latest

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to AWS ECS
        run: |
          aws ecs update-service \\
            --cluster datachoreography \\
            --service backend \\
            --force-new-deployment`}</pre>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monitoring & Logging</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Required Metrics</h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• API response times (p50, p95, p99)</li>
                      <li>• Workflow execution success rate</li>
                      <li>• Database connection pool usage</li>
                      <li>• Redis cache hit rate</li>
                      <li>• Credential vault encryption/decryption latency</li>
                      <li>• Compliance event write latency</li>
                      <li>• Webhook delivery success rate</li>
                      <li>• Tenant isolation violations (should be 0)</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Alerts</h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Error rate &gt; 1% → PagerDuty</li>
                      <li>• API latency p95 &gt; 500ms → Slack</li>
                      <li>• Workflow failure rate &gt; 5% → Email</li>
                      <li>• Database CPU &gt; 80% → Auto-scale</li>
                      <li>• Redis memory &gt; 90% → Auto-scale</li>
                      <li>• Compliance event chain broken → Critical alert</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Log Aggregation</h4>
                    <div className="bg-gray-50 border border-gray-200 rounded p-3 font-mono text-xs">
                      <pre>{`// Structured logging with Winston
import winston from 'winston';

const logger = winston.createLogger({
  format: winston.format.json(),
  transports: [
    new winston.transports.CloudWatch({
      logGroupName: '/datachoreography/backend',
      logStreamName: process.env.INSTANCE_ID
    })
  ]
});

logger.info('Workflow executed', {
  tenant_id: 'abc123',
  workflow_id: 'def456',
  duration_ms: 1234,
  status: 'completed'
});`}</pre>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== ROADMAP TAB ===== */}
          <TabsContent value="roadmap" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Map className="w-6 h-6 text-indigo-600" />
                  Post-Handoff Roadmap
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className="bg-red-600">Weeks 1-2</Badge>
                      <h3 className="font-semibold text-lg">Backend Core Completion</h3>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-start gap-2">
                        <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">P0</span>
                        <span>Implement workflow execution engine with polling, retries, circuit breakers</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">P0</span>
                        <span>Add OAuth2 flows for Shopify, Stripe, Xero (callback handling, token refresh)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">P0</span>
                        <span>Build integration proxy layer (shopify/orders, stripe/charges, xero/invoices)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">P0</span>
                        <span>Webhook receivers with signature verification</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">P0</span>
                        <span>Write unit tests for security (encryption, RLS, JWT, compliance chain)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">P0</span>
                        <span>Integration tests for marketplace install flow</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className="bg-orange-600">Weeks 3-4</Badge>
                      <h3 className="font-semibold text-lg">Marketplace & Approvals</h3>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-start gap-2">
                        <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">P1</span>
                        <span>Publisher review queue UI + admin approval flow</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">P1</span>
                        <span>Approval notification system (email + Slack with buttons)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">P1</span>
                        <span>Template installation wizard with validation</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">P1</span>
                        <span>Metrics aggregation cron job (daily rollups)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">P1</span>
                        <span>Real-time workflow status updates (WebSocket or SSE)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">P1</span>
                        <span>Connect frontend to backend API (replace base44 SDK)</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className="bg-yellow-600">Weeks 5-6</Badge>
                      <h3 className="font-semibold text-lg">50-Tenant Beta Prep</h3>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-start gap-2">
                        <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">P1</span>
                        <span>Load testing (100 concurrent users, 50 concurrent workflows)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">P1</span>
                        <span>Rate limiting per tenant (prevent runaway workflows)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">P1</span>
                        <span>Database query optimization + indexing</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">P1</span>
                        <span>Monitoring dashboard (CloudWatch/Datadog)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">P1</span>
                        <span>Automated backups + disaster recovery plan</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">P1</span>
                        <span>Onboarding flow polish (target TTFR &lt; 5 minutes)</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className="bg-green-600">Weeks 7-8</Badge>
                      <h3 className="font-semibold text-lg">SOC2/GDPR Readiness</h3>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-start gap-2">
                        <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">P2</span>
                        <span>GDPR crypto-shredding automation (scheduled cleanup job)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">P2</span>
                        <span>Data export API for GDPR subject access requests</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">P2</span>
                        <span>Compliance dashboard (audit log viewer, chain verification)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">P2</span>
                        <span>Security penetration testing</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">P2</span>
                        <span>SOC2 audit preparation (evidence collection)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">P2</span>
                        <span>Incident response playbook</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Future Feature Roadmap (Post-Beta)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-l-4 border-indigo-500 pl-4">
                    <h4 className="font-semibold text-indigo-900 mb-2">Q2 2025: AI Agents</h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Natural language workflow creation ("Automate my refund process")</li>
                      <li>• Intelligent error resolution (auto-retry with modified parameters)</li>
                      <li>• Predictive workflow optimization (suggest approval thresholds)</li>
                      <li>• Anomaly detection (flag unusual transaction patterns)</li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-purple-500 pl-4">
                    <h4 className="font-semibold text-purple-900 mb-2">Q3 2025: Enterprise Features</h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Multi-user collaboration (roles: admin, editor, viewer)</li>
                      <li>• Workflow versioning + rollback</li>
                      <li>• Custom approval policies per workflow</li>
                      <li>• White-label deployment for agencies</li>
                      <li>• SSO integration (Okta, Azure AD)</li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-green-500 pl-4">
                    <h4 className="font-semibold text-green-900 mb-2">Q4 2025: Global Expansion</h4>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Multi-currency support</li>
                      <li>• Regional compliance (CCPA, PIPEDA, etc.)</li>
                      <li>• Internationalization (French, German, Spanish)</li>
                      <li>• Regional data residency (EU, US, APAC)</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <Card className="mt-8 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200">
          <CardContent className="pt-6">
            <h2 className="text-2xl font-bold text-indigo-900 mb-4">🚀 Ready to Ship</h2>
            <p className="text-indigo-800 mb-4">
              This document contains everything needed to continue DataChoreography development. 
              All architecture decisions, security patterns, and API contracts are documented above.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-4">
                <Code className="w-8 h-8 text-indigo-600 mb-2" />
                <h3 className="font-semibold mb-1">Backend Code</h3>
                <p className="text-sm text-gray-600">
                  See "Backend Code" pages for complete implementation
                </p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <Layout className="w-8 h-8 text-purple-600 mb-2" />
                <h3 className="font-semibold mb-1">Frontend Pages</h3>
                <p className="text-sm text-gray-600">
                  All UI components ready in pages/ directory
                </p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <Database className="w-8 h-8 text-green-600 mb-2" />
                <h3 className="font-semibold mb-1">Database Schema</h3>
                <p className="text-sm text-gray-600">
                  Drizzle migrations + seed data included
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}