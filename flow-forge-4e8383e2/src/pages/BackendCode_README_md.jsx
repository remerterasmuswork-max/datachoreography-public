import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle } from 'lucide-react';

export default function BackendCode_README_md() {
  const [copied, setCopied] = React.useState(false);
  
  const code = `# DataChoreography Backend

Production-ready multi-tenant SaaS backend with security hardening.

## Features

- ✅ **Multi-Tenant Security**: PostgreSQL RLS + JWT isolation
- ✅ **Idempotency**: Prevent duplicate operations
- ✅ **Distributed Locking**: Single-execution guarantee
- ✅ **Credential Vault**: AWS Secrets Manager + local encryption
- ✅ **Compliance Chain**: SHA-256 hash chain with Merkle anchors
- ✅ **Structured Logging**: JSON logs with request/correlation IDs
- ✅ **Health Checks**: Ready/live endpoints
- ✅ **OpenAPI Docs**: Auto-generated from code

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Fastify
- **Database**: PostgreSQL 16 with RLS
- **ORM**: Drizzle
- **Auth**: JWT (RS256) via jose
- **Cache**: Redis (optional)
- **Language**: TypeScript

## Quick Start

### 1. Generate JWT Keys

\`\`\`bash
# Generate RSA key pair
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem

# Convert to base64 for env vars
export JWT_PRIVATE_KEY_BASE64=$(base64 -w 0 private.pem)
export JWT_PUBLIC_KEY_BASE64=$(base64 -w 0 public.pem)

# Generate hash pepper
export HASH_PEPPER=$(openssl rand -hex 32)
\`\`\`

### 2. Start Infrastructure

\`\`\`bash
# Start PostgreSQL + Redis
docker-compose up -d postgres redis

# Or use existing database
export DATABASE_URL="postgres://user:pass@localhost:5432/dbname"
\`\`\`

### 3. Run Migrations

\`\`\`bash
pnpm install
pnpm db:migrate
pnpm db:seed
\`\`\`

### 4. Start Server

\`\`\`bash
# Development
pnpm dev

# Production
pnpm build
pnpm start
\`\`\`

Server runs on http://localhost:3000

## API Endpoints

### Health
- \`GET /healthz\` - Health check
- \`GET /readyz\` - Readiness check

### Authentication
- \`POST /v2/auth/register\` - Register new user
- \`POST /v2/auth/login\` - Login
- \`POST /v2/auth/refresh\` - Refresh token
- \`POST /v2/auth/impersonate\` - Admin impersonation
- \`GET /v2/auth/me\` - Current user info

### Tenants
- \`GET /v2/tenants/me\` - Current tenant
- \`GET /v2/tenants\` - List all (admin only)
- \`POST /v2/tenants\` - Create tenant (admin only)

### Workflows
- \`POST /v2/workflows/trigger\` - Trigger workflow
- \`GET /v2/workflows/runs/:id\` - Get run details
- \`POST /v2/workflows/runs/:id/cancel\` - Cancel run

### Credentials
- \`POST /v2/credentials\` - Add connection
- \`GET /v2/credentials\` - List connections
- \`POST /v2/credentials/:id/test\` - Test connection
- \`POST /v2/credentials/:id/execute\` - Execute action
- \`DELETE /v2/credentials/:id\` - Delete (crypto-shred)

### Compliance
- \`GET /v2/compliance/events\` - Query audit events
- \`POST /v2/compliance/verify-chain\` - Verify integrity
- \`GET /v2/compliance/anchors\` - Get Merkle anchors
- \`GET /v2/compliance/export\` - Export for audit

## Environment Variables

\`\`\`bash
# Required
DATABASE_URL=postgres://...
JWT_PRIVATE_KEY_BASE64=...
JWT_PUBLIC_KEY_BASE64=...
HASH_PEPPER=...

# Optional
PORT=3000
NODE_ENV=production
LOG_LEVEL=info
REDIS_URL=redis://localhost:6379
VAULT_PROVIDER=local  # or 'aws'
AWS_REGION=us-east-1
CORS_ORIGIN=*
\`\`\`

## Security Features

### Multi-Tenant Isolation

Every request sets PostgreSQL session variable:

\`\`\`sql
SET LOCAL app.tenant_id = '<uuid>';
\`\`\`

RLS policies enforce:

\`\`\`sql
CREATE POLICY tenant_isolation_policy ON tablename
  USING (tenant_id = current_setting('app.tenant_id')::UUID);
\`\`\`

### Idempotency

Use \`Idempotency-Key\` header on POST requests:

\`\`\`bash
curl -X POST http://localhost:3000/v2/workflows/trigger \\
  -H "Authorization: Bearer \${TOKEN}" \\
  -H "Idempotency-Key: unique-key-123" \\
  -d '{"workflow_id": "..."}'
\`\`\`

Duplicate requests return cached result.

### Distributed Locking

Workflow runs use optimistic locking:

\`\`\`typescript
const locked = await acquireLock(runId, workerId);
if (!locked) {
  // Another worker is processing this run
  return;
}
\`\`\`

### Compliance Chain

Every audit event has:
- \`digest_sha256\`: SHA-256 hash of event data
- \`prev_digest_sha256\`: Hash of previous event

Verify integrity:

\`\`\`bash
curl -X POST http://localhost:3000/v2/compliance/verify-chain \\
  -H "Authorization: Bearer \${TOKEN}"
\`\`\`

## Testing

\`\`\`bash
# Unit tests
pnpm test

# Integration tests
pnpm test:integration

# Coverage
pnpm test --coverage
\`\`\`

## Deployment

### Docker

\`\`\`bash
docker build -t datachor-backend .
docker run -p 3000:3000 \\
  -e DATABASE_URL=... \\
  -e JWT_PRIVATE_KEY_BASE64=... \\
  datachor-backend
\`\`\`

### Docker Compose

\`\`\`bash
docker-compose up -d
\`\`\`

### Kubernetes

See \`k8s/\` directory for manifests.

## Monitoring

- **Logs**: JSON structured logs with request IDs
- **Metrics**: Prometheus endpoint at \`/metrics\`
- **Dashboards**: Grafana at http://localhost:3001 (admin/admin)

## License

UNLICENSED`;

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-mono text-gray-700">README.md</h2>
              <Button onClick={copyCode} size="sm">
                {copied ? <CheckCircle className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
              <code>{code}</code>
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}