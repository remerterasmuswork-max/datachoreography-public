import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Database, 
  Lock, 
  Shield, 
  FileText, 
  Cog,
  AlertTriangle 
} from 'lucide-react';

export default function BackendMigrationGuide() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Backend Migration Guide</h1>
          <p className="text-gray-600 mt-2">
            Comprehensive guide for implementing server-side security enforcement
          </p>
        </div>

        <Alert className="mb-8 border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>CRITICAL:</strong> The current frontend implementation is a placeholder. 
            All security-critical features MUST be reimplemented on the backend before production deployment.
          </AlertDescription>
        </Alert>

        {/* Overview */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700">
              This guide provides backend developers with specifications to implement 
              server-side enforcement of security, tenant isolation, and compliance features 
              currently handled on the frontend.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900">Current State</h4>
                <p className="text-sm text-blue-700">Frontend filters & validation</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-900">Target State</h4>
                <p className="text-sm text-green-700">Backend-enforced security</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Phase 1: Tenant Isolation */}
        <MigrationPhase
          icon={Shield}
          title="Phase 1: Tenant Isolation"
          priority="P0 - BLOCKING"
          phases={[
            {
              title: "Database Row-Level Security (RLS)",
              description: "Implement PostgreSQL RLS policies for all tenant-scoped tables",
              code: `-- Enable RLS on all tenant-scoped tables
ALTER TABLE runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY tenant_isolation_policy ON runs
    USING (tenant_id = current_setting('app.current_tenant_id')::text);

-- Set tenant context per request
SET app.current_tenant_id = '<tenant_id_from_jwt>';`
            },
            {
              title: "JWT-Based Tenant Extraction",
              description: "Extract tenant_id from JWT on every request",
              code: `// Backend middleware
function extractTenantFromJWT(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.tenantId = decoded.tenant_id;
    req.userId = decoded.user_id;
    
    // Set database session variable
    await db.query(\`SET app.current_tenant_id = $1\`, [req.tenantId]);
    
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

app.use('/api/*', extractTenantFromJWT);`
            },
            {
              title: "Migration Steps",
              description: "Step-by-step implementation",
              steps: [
                "Deploy RLS policies to database",
                "Update Base44 Entity SDK to extract tenant from JWT",
                "Remove frontend TenantEntity.wrap() calls",
                "Frontend sends JWT, backend enforces"
              ]
            }
          ]}
        />

        {/* Phase 2: Credential Vault */}
        <MigrationPhase
          icon={Lock}
          title="Phase 2: Credential Vault"
          priority="P0 - BLOCKING"
          phases={[
            {
              title: "HSM Integration",
              description: "Use AWS Secrets Manager / HashiCorp Vault for credential storage",
              code: `const AWS = require('aws-sdk');
const secretsManager = new AWS.SecretsManager();

async function storeCredential(tenantId, connectionId, credentials) {
  const secretName = \`datachor/\${tenantId}/\${connectionId}\`;
  
  await secretsManager.createSecret({
    Name: secretName,
    SecretString: JSON.stringify(credentials),
    Tags: [
      { Key: 'tenant_id', Value: tenantId },
      { Key: 'connection_id', Value: connectionId }
    ]
  }).promise();
  
  // Store reference in database (NOT the credential itself)
  await db.query(
    \`INSERT INTO connections (tenant_id, connection_id, secret_arn) 
     VALUES ($1, $2, $3)\`,
    [tenantId, connectionId, secretName]
  );
  
  return connectionId;
}`
            },
            {
              title: "API Endpoints",
              description: "Server-side credential management",
              code: `// POST /api/v1/vault/connections
app.post('/api/v1/vault/connections', async (req, res) => {
  const { provider, credentials, metadata } = req.body;
  const { tenantId, userId } = req;
  
  // Validate credentials format
  validateCredentials(provider, credentials);
  
  // Store in HSM
  const connectionId = uuidv4();
  await storeCredential(tenantId, connectionId, credentials);
  
  // Log to audit trail
  await logVaultAccess(tenantId, userId, 'create', connectionId);
  
  res.json({ connection_id: connectionId });
});

// POST /api/v1/vault/execute
app.post('/api/v1/vault/execute', async (req, res) => {
  const { connection_id, action, params } = req.body;
  const { tenantId, userId } = req;
  
  // Fetch credentials (server-side only)
  const credentials = await getCredential(tenantId, connection_id);
  
  // Execute action via MCP server
  const result = await mcpClient.execute(action, params, credentials);
  
  // Log to audit trail (NEVER log credentials)
  await logVaultAccess(tenantId, userId, 'execute', connection_id, action);
  
  res.json(result);
});`
            },
            {
              title: "Migration Steps",
              steps: [
                "Deploy HSM (AWS Secrets Manager recommended)",
                "Migrate existing credentials from Credential entity to HSM",
                "Update credentialVault.enableBackendMode()",
                "Remove frontend credential storage"
              ]
            }
          ]}
        />

        {/* Phase 3: Compliance Logging */}
        <MigrationPhase
          icon={FileText}
          title="Phase 3: Compliance Logging"
          priority="P1"
          phases={[
            {
              title: "Server-Side Chain Verification",
              description: "Compute and verify hash chains on backend",
              code: `// Verify chain integrity on every write
async function logComplianceEvent(tenantId, eventData) {
  // Fetch last event
  const lastEvent = await db.query(
    \`SELECT digest_sha256 FROM compliance_events 
     WHERE tenant_id = $1 
     ORDER BY ts DESC LIMIT 1\`,
    [tenantId]
  );
  
  const prevDigest = lastEvent.rows[0]?.digest_sha256 || '';
  
  // Compute digest
  const currentDigest = computeSHA256(prevDigest + JSON.stringify(eventData));
  
  // Insert with digest
  await db.query(
    \`INSERT INTO compliance_events 
     (tenant_id, category, event_type, digest_sha256, prev_digest_sha256, ...) 
     VALUES ($1, $2, $3, $4, $5, ...)\`,
    [tenantId, eventData.category, eventData.event_type, currentDigest, prevDigest, ...]
  );
  
  return currentDigest;
}`
            },
            {
              title: "Periodic Chain Verification",
              description: "Cron job to verify chain integrity",
              code: `// Run this every hour
async function verifyChainIntegrity(tenantId) {
  const events = await db.query(
    \`SELECT * FROM compliance_events 
     WHERE tenant_id = $1 
     ORDER BY ts ASC\`,
    [tenantId]
  );
  
  let prevDigest = '';
  for (const event of events.rows) {
    const expectedDigest = computeSHA256(prevDigest + JSON.stringify(event));
    
    if (event.digest_sha256 !== expectedDigest) {
      await alertSecurityTeam('Chain integrity violation', {
        tenant_id: tenantId,
        event_id: event.id,
        expected: expectedDigest,
        actual: event.digest_sha256
      });
      
      return false;
    }
    
    prevDigest = event.digest_sha256;
  }
  
  return true;
}`
            }
          ]}
        />

        {/* Phase 4: Workflow Execution */}
        <MigrationPhase
          icon={Cog}
          title="Phase 4: Workflow Execution"
          priority="P1"
          phases={[
            {
              title: "Centralized Workflow Engine",
              description: "Background worker with distributed locking",
              code: `class WorkflowEngine {
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
  }
  
  async processWorkflows() {
    while (true) {
      const workflows = await this.fetchPendingWorkflows();
      
      for (const workflow of workflows) {
        try {
          await this.executeWorkflow(workflow);
        } catch (error) {
          await this.handleWorkflowError(workflow, error);
        }
      }
      
      await this.sleep(1000); // 1 second polling
    }
  }
  
  async fetchPendingWorkflows() {
    // Use Redis distributed lock
    const lock = await this.redis.set(
      'workflow:lock',
      process.env.WORKER_ID,
      'NX',
      'EX',
      10 // 10 second expiry
    );
    
    if (!lock) return []; // Another worker has the lock
    
    // Fetch pending runs with Postgres row-level lock
    const runs = await db.query(
      \`SELECT * FROM runs 
       WHERE status = 'pending' 
       ORDER BY started_at ASC 
       LIMIT 10 
       FOR UPDATE SKIP LOCKED\`
    );
    
    return runs.rows;
  }
}`
            },
            {
              title: "Migration Steps",
              steps: [
                "Deploy Redis for distributed locking",
                "Deploy workflow engine as separate service",
                "Update frontend to stop polling",
                "Frontend only displays status (read-only)"
              ]
            }
          ]}
        />

        {/* Phase 5: GDPR Compliance */}
        <MigrationPhase
          icon={Database}
          title="Phase 5: GDPR Compliance"
          priority="P1"
          phases={[
            {
              title: "Crypto-Shredding Implementation",
              description: "Per-user encryption keys in HSM",
              code: `// GDPR Article 17: Right to Erasure
async function eraseUserData(userId, reason) {
  // 1. Log erasure request (this log is kept)
  await logComplianceEvent(userId, {
    category: 'data_access',
    event_type: 'gdpr_erasure_request',
    reason
  });
  
  // 2. Delete encryption key from HSM
  await deleteEncryptionKey(userId);
  
  // 3. Encrypted data remains in database but is unrecoverable
  // 4. Audit trail remains intact (PII was already redacted)
  
  // 5. Verify deletion
  try {
    await getEncryptionKey(userId);
    throw new Error('Key deletion failed');
  } catch (error) {
    if (error.code === 'KeyNotFound') {
      return { success: true, method: 'crypto_shred' };
    }
    throw error;
  }
}`
            },
            {
              title: "Data Export API",
              description: "GDPR Article 20: Right to Data Portability",
              code: `app.get('/api/v1/gdpr/export', async (req, res) => {
  const { tenantId, userId } = req;
  
  // Collect all user data
  const exportData = {
    user_profile: await fetchUserProfile(userId),
    orders: await fetchUserOrders(userId),
    invoices: await fetchUserInvoices(userId),
    approvals: await fetchUserApprovals(userId),
    audit_trail: await fetchUserAuditTrail(userId)
  };
  
  // Generate export file
  const exportFile = await generateDataExport(exportData, 'json');
  
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 
    \`attachment; filename="user-\${userId}-export.json"\`);
  res.send(exportFile);
});`
            }
          ]}
        />

        {/* Rollout Plan */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cog className="w-5 h-5" />
              6-Week Rollout Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <RolloutWeek week={1} title="Database Layer" items={[
                "Deploy RLS policies",
                "Add tenant_id indexes",
                "Test RLS enforcement"
              ]} />
              <RolloutWeek week={2} title="Authentication Layer" items={[
                "Implement JWT issuance",
                "Add tenant extraction middleware",
                "Migrate frontend to JWT"
              ]} />
              <RolloutWeek week={3} title="Credential Vault" items={[
                "Deploy HSM (AWS Secrets Manager)",
                "Migrate existing credentials",
                "Update frontend to use vault API"
              ]} />
              <RolloutWeek week={4} title="Compliance & Workflows" items={[
                "Deploy compliance API",
                "Deploy workflow engine",
                "Migrate frontend polling to backend"
              ]} />
              <RolloutWeek week={5} title="GDPR Features" items={[
                "Implement crypto-shredding",
                "Deploy data export API",
                "Test erasure flow"
              ]} />
              <RolloutWeek week={6} title="Testing & Cutover" items={[
                "Run integration tests",
                "Perform security audit",
                "Gradual rollout (5% → 50% → 100%)",
                "Remove frontend enforcement code"
              ]} />
            </div>
          </CardContent>
        </Card>

        {/* Post-Migration Cleanup */}
        <Card>
          <CardHeader>
            <CardTitle>Post-Migration Cleanup</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">
              Once backend is deployed and verified:
            </p>
            <ul className="space-y-2">
              {[
                "Remove TenantEntity.wrap() wrapper",
                "Remove TenantDefense client-side validation",
                "Remove CredentialVault frontend mode",
                "Keep ComplianceLogger as backup logger",
                "Update documentation"
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-1">{idx + 1}</Badge>
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MigrationPhase({ icon: Icon, title, priority, phases }) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Icon className="w-5 h-5" />
            {title}
          </CardTitle>
          <Badge className={
            priority.includes('P0') ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
          }>
            {priority}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {phases.map((phase, idx) => (
          <div key={idx} className="border-l-4 border-indigo-500 pl-4">
            <h4 className="font-semibold text-gray-900 mb-2">{phase.title}</h4>
            <p className="text-sm text-gray-600 mb-3">{phase.description}</p>
            
            {phase.code && (
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs">
                <code>{phase.code}</code>
              </pre>
            )}
            
            {phase.steps && (
              <ul className="space-y-2">
                {phase.steps.map((step, stepIdx) => (
                  <li key={stepIdx} className="flex items-start gap-2 text-sm text-gray-700">
                    <Badge variant="outline" className="mt-0.5">{stepIdx + 1}</Badge>
                    {step}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function RolloutWeek({ week, title, items }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Badge className="bg-indigo-100 text-indigo-800">Week {week}</Badge>
        <h4 className="font-semibold text-gray-900">{title}</h4>
      </div>
      <ul className="ml-6 space-y-1">
        {items.map((item, idx) => (
          <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
            <span className="text-indigo-500 mt-0.5">□</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}