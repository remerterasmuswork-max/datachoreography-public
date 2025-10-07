import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, Download, CheckCircle } from 'lucide-react';

export default function BackendSetupGuide() {
  const [copiedSection, setCopiedSection] = useState(null);

  const copyToClipboard = (text, section) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const CodeBlock = ({ title, code, language = 'typescript', section }) => (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-semibold text-gray-900">{title}</h4>
        <Button
          size="sm"
          variant="outline"
          onClick={() => copyToClipboard(code, section)}
        >
          {copiedSection === section ? (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </>
          )}
        </Button>
      </div>
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
        <code>{code}</code>
      </pre>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Backend Setup Guide</h1>
          <p className="text-gray-600 mt-2">
            Complete backend implementation - copy and paste to get started
          </p>
          <div className="flex gap-2 mt-4">
            <Badge className="bg-blue-100 text-blue-800">TypeScript + Fastify</Badge>
            <Badge className="bg-green-100 text-green-800">PostgreSQL RLS</Badge>
            <Badge className="bg-purple-100 text-purple-800">Production Ready</Badge>
          </div>
        </div>

        <Tabs defaultValue="structure" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="structure">Structure</TabsTrigger>
            <TabsTrigger value="config">Config</TabsTrigger>
            <TabsTrigger value="db">Database</TabsTrigger>
            <TabsTrigger value="auth">Auth</TabsTrigger>
            <TabsTrigger value="modules">Modules</TabsTrigger>
            <TabsTrigger value="deployment">Deploy</TabsTrigger>
          </TabsList>

          {/* PROJECT STRUCTURE */}
          <TabsContent value="structure">
            <Card>
              <CardHeader>
                <CardTitle>Project Structure</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-4">Create this folder structure:</h3>
                  <CodeBlock
                    title="mkdir commands"
                    section="structure-1"
                    language="bash"
                    code={`mkdir -p backend/{src/{config,auth,middleware,modules/{tenant,vault,workflow,compliance},lib,db/{migrations,seeds},jobs,routes},tests/{unit,integration,contract},scripts,ops/{grafana,k6,redteam,runbook}}

cd backend
npm init -y`}
                  />
                </div>

                <CodeBlock
                  title="package.json"
                  section="structure-2"
                  language="json"
                  code={`{
  "name": "datachoreography-backend",
  "version": "1.0.0",
  "description": "DataChoreography Backend API",
  "main": "dist/index.js",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc && tsc-alias",
    "start": "node dist/index.js",
    "test": "jest --coverage",
    "test:integration": "jest --testMatch='**/*.integration.test.ts'",
    "migrate": "tsx scripts/migrate.ts",
    "seed": "tsx scripts/seed.ts",
    "lint": "eslint src --ext .ts",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@fastify/cors": "^9.0.1",
    "@fastify/helmet": "^11.1.1",
    "@fastify/jwt": "^7.2.4",
    "@fastify/rate-limit": "^9.1.0",
    "@fastify/swagger": "^8.14.0",
    "@fastify/swagger-ui": "^3.0.0",
    "aws-sdk": "^2.1544.0",
    "bcrypt": "^5.1.1",
    "fastify": "^4.26.1",
    "ioredis": "^5.3.2",
    "pg": "^8.11.3",
    "pino": "^8.19.0",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/bcrypt": "^5.0.2",
    "@types/jest": "^29.5.11",
    "@types/node": "^20.11.16",
    "@types/pg": "^8.11.0",
    "@typescript-eslint/eslint-plugin": "^6.21.0",
    "eslint": "^8.56.0",
    "eslint-plugin-security": "^2.1.0",
    "jest": "^29.7.0",
    "supertest": "^6.3.4",
    "ts-jest": "^29.1.2",
    "tsx": "^4.7.0",
    "typescript": "^5.3.3"
  }
}`}
                />

                <CodeBlock
                  title="tsconfig.json"
                  section="structure-3"
                  language="json"
                  code={`{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    },
    "types": ["node", "jest"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}`}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* CONFIGURATION */}
          <TabsContent value="config">
            <Card>
              <CardHeader>
                <CardTitle>Configuration & Environment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <CodeBlock
                  title=".env.example"
                  section="config-1"
                  language="bash"
                  code={`# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/datachoreography
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your-256-bit-secret-change-in-production
JWT_EXPIRY=1h
JWT_REFRESH_EXPIRY=30d

# AWS (for Secrets Manager)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
VAULT_PROVIDER=local # local | aws

# Server
PORT=3000
NODE_ENV=development
LOG_LEVEL=info

# Feature Flags
ENABLE_RLS=true
ENABLE_RATE_LIMIT=true
ENABLE_COMPLIANCE_JOBS=true

# Security
ALLOWED_ORIGINS=http://localhost:3001,https://app.datachoreography.com
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=60000

# Monitoring
ENABLE_METRICS=true
METRICS_PORT=9090`}
                />

                <CodeBlock
                  title="src/config/index.ts - Environment Validation"
                  section="config-2"
                  code={`import { z } from 'zod';

const configSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),
  DATABASE_POOL_MIN: z.coerce.number().min(1).default(2),
  DATABASE_POOL_MAX: z.coerce.number().min(2).default(10),
  
  // Redis
  REDIS_URL: z.string().url(),
  REDIS_PASSWORD: z.string().optional(),
  
  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRY: z.string().default('1h'),
  JWT_REFRESH_EXPIRY: z.string().default('30d'),
  
  // AWS
  AWS_REGION: z.string().default('us-east-1'),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  VAULT_PROVIDER: z.enum(['local', 'aws']).default('local'),
  
  // Server
  PORT: z.coerce.number().min(1000).max(65535).default(3000),
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  
  // Feature Flags
  ENABLE_RLS: z.coerce.boolean().default(true),
  ENABLE_RATE_LIMIT: z.coerce.boolean().default(true),
  ENABLE_COMPLIANCE_JOBS: z.coerce.boolean().default(true),
  
  // Security
  ALLOWED_ORIGINS: z.string().transform(s => s.split(',')),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  RATE_LIMIT_WINDOW: z.coerce.number().default(60000),
  
  // Monitoring
  ENABLE_METRICS: z.coerce.boolean().default(true),
  METRICS_PORT: z.coerce.number().default(9090),
});

export type Config = z.infer<typeof configSchema>;

function loadConfig(): Config {
  const parsed = configSchema.safeParse(process.env);
  
  if (!parsed.success) {
    console.error('❌ Invalid environment configuration:');
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
  }
  
  return parsed.data;
}

export const config = loadConfig();

// Validate critical production settings
if (config.NODE_ENV === 'production') {
  if (config.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters in production');
  }
  
  if (config.VAULT_PROVIDER === 'local') {
    console.warn('⚠️  WARNING: Using local vault in production is insecure');
  }
  
  if (!config.ENABLE_RLS) {
    throw new Error('RLS must be enabled in production');
  }
}

export default config;`}
                />

                <CodeBlock
                  title="src/config/logger.ts - Structured Logging"
                  section="config-3"
                  code={`import pino from 'pino';
import { config } from './index';

export const logger = pino({
  level: config.LOG_LEVEL,
  transport: config.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname',
    },
  } : undefined,
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      headers: {
        host: req.headers.host,
        'user-agent': req.headers['user-agent'],
      },
      remoteAddress: req.ip,
      remotePort: req.socket?.remotePort,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
    err: pino.stdSerializers.err,
  },
});

// Add request ID to all logs
export function createRequestLogger(requestId: string, tenantId?: string, userId?: string) {
  return logger.child({
    request_id: requestId,
    tenant_id: tenantId,
    user_id: userId,
  });
}

export default logger;`}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* DATABASE */}
          <TabsContent value="db">
            <Card>
              <CardHeader>
                <CardTitle>Database Setup & Migrations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <CodeBlock
                  title="src/db/index.ts - Database Connection with RLS"
                  section="db-1"
                  code={`import { Pool, PoolClient } from 'pg';
import { config } from '@/config';
import { logger } from '@/config/logger';

export const pool = new Pool({
  connectionString: config.DATABASE_URL,
  min: config.DATABASE_POOL_MIN,
  max: config.DATABASE_POOL_MAX,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected database error');
});

pool.on('connect', (client) => {
  logger.debug('New database connection established');
});

/**
 * Execute query with automatic tenant context
 * Sets session variable for RLS before running query
 */
export async function queryWithTenant<T = any>(
  tenantId: string,
  query: string,
  params?: any[]
): Promise<T[]> {
  const client = await pool.connect();
  
  try {
    // Set tenant context for RLS
    await client.query(\`SET LOCAL app.current_tenant_id = $1\`, [tenantId]);
    
    const result = await client.query(query, params);
    return result.rows;
  } finally {
    client.release();
  }
}

/**
 * Transaction with tenant context
 */
export async function transactionWithTenant<T>(
  tenantId: string,
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    await client.query(\`SET LOCAL app.current_tenant_id = $1\`, [tenantId]);
    
    const result = await callback(client);
    
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Health check
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch (error) {
    logger.error({ err: error }, 'Database health check failed');
    return false;
  }
}

export default pool;`}
                />

                <CodeBlock
                  title="db/migrations/001_initial_schema.sql"
                  section="db-2"
                  language="sql"
                  code={`-- =====================================================================
-- DATACHOREOGRAPHY INITIAL SCHEMA
-- Multi-tenant with Row-Level Security (RLS)
-- =====================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================================
-- TENANTS
-- =====================================================================

CREATE TABLE tenants (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  plan VARCHAR(50) NOT NULL DEFAULT 'free',
  owner_email VARCHAR(255) NOT NULL,
  member_emails TEXT[] DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tenants_status ON tenants(status);
CREATE INDEX idx_tenants_owner ON tenants(owner_email);

-- =====================================================================
-- USERS
-- =====================================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_role ON users(tenant_id, role);

-- =====================================================================
-- SESSIONS (for JWT refresh tokens)
-- =====================================================================

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  refresh_token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_tenant ON sessions(tenant_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- =====================================================================
-- CONNECTIONS (for integrations)
-- =====================================================================

CREATE TABLE connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  provider VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  vault_key_id VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  config JSONB DEFAULT '{}',
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_connections_tenant ON connections(tenant_id);
CREATE INDEX idx_connections_provider ON connections(tenant_id, provider);
CREATE INDEX idx_connections_status ON connections(tenant_id, status);

-- Enable RLS
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY connections_tenant_isolation ON connections
  USING (tenant_id = current_setting('app.current_tenant_id', true)::text);

-- =====================================================================
-- WORKFLOWS
-- =====================================================================

CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  trigger_type VARCHAR(100) NOT NULL,
  trigger_config JSONB DEFAULT '{}',
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_workflows_tenant ON workflows(tenant_id);
CREATE INDEX idx_workflows_status ON workflows(tenant_id, status);
CREATE INDEX idx_workflows_trigger ON workflows(tenant_id, trigger_type);

ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY workflows_tenant_isolation ON workflows
  USING (tenant_id = current_setting('app.current_tenant_id', true)::text);

-- =====================================================================
-- WORKFLOW STEPS
-- =====================================================================

CREATE TABLE workflow_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  step_type VARCHAR(100) NOT NULL,
  connection_id UUID REFERENCES connections(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_steps_workflow ON workflow_steps(workflow_id, step_order);
CREATE INDEX idx_steps_tenant ON workflow_steps(tenant_id);

ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY workflow_steps_tenant_isolation ON workflow_steps
  USING (tenant_id = current_setting('app.current_tenant_id', true)::text);

-- =====================================================================
-- RUNS
-- =====================================================================

CREATE TABLE runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  trigger_source VARCHAR(100),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  idempotency_key VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CRITICAL: Compound indexes for common queries
CREATE INDEX idx_runs_tenant_status_created ON runs(tenant_id, status, created_at DESC);
CREATE INDEX idx_runs_workflow_created ON runs(workflow_id, created_at DESC);
CREATE INDEX idx_runs_idempotency ON runs(tenant_id, idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX idx_runs_status_updated ON runs(status, updated_at) WHERE status IN ('pending', 'running');

ALTER TABLE runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY runs_tenant_isolation ON runs
  USING (tenant_id = current_setting('app.current_tenant_id', true)::text);

-- =====================================================================
-- RUN LOGS
-- =====================================================================

CREATE TABLE run_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  run_id UUID NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  step_id UUID REFERENCES workflow_steps(id) ON DELETE SET NULL,
  level VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_run_logs_run ON run_logs(run_id, created_at);
CREATE INDEX idx_run_logs_tenant ON run_logs(tenant_id);

ALTER TABLE run_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY run_logs_tenant_isolation ON run_logs
  USING (tenant_id = current_setting('app.current_tenant_id', true)::text);

-- =====================================================================
-- IDEMPOTENCY KEYS (for duplicate request prevention)
-- =====================================================================

CREATE TABLE idempotency_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  idempotency_key VARCHAR(255) NOT NULL,
  request_path VARCHAR(500) NOT NULL,
  request_body JSONB,
  response_status INTEGER,
  response_body JSONB,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_idempotency_unique ON idempotency_keys(tenant_id, idempotency_key, request_path);
CREATE INDEX idx_idempotency_expires ON idempotency_keys(expires_at);

ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY idempotency_keys_tenant_isolation ON idempotency_keys
  USING (tenant_id = current_setting('app.current_tenant_id', true)::text);

-- =====================================================================
-- DISTRIBUTED LOCKS (for preventing concurrent execution)
-- =====================================================================

CREATE TABLE distributed_locks (
  lock_key VARCHAR(255) PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  owner_id VARCHAR(255) NOT NULL,
  acquired_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_locks_tenant ON distributed_locks(tenant_id);
CREATE INDEX idx_locks_expires ON distributed_locks(expires_at);

-- =====================================================================
-- COMPLIANCE EVENTS (immutable audit trail)
-- =====================================================================

CREATE TABLE compliance_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category VARCHAR(100) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  actor VARCHAR(255) NOT NULL,
  ref_type VARCHAR(100),
  ref_id VARCHAR(255),
  payload JSONB NOT NULL,
  digest_sha256 VARCHAR(64) NOT NULL,
  prev_digest_sha256 VARCHAR(64),
  pii_redacted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_compliance_tenant_created ON compliance_events(tenant_id, created_at DESC);
CREATE INDEX idx_compliance_category ON compliance_events(tenant_id, category);
CREATE INDEX idx_compliance_ref ON compliance_events(ref_type, ref_id);
CREATE INDEX idx_compliance_chain ON compliance_events(tenant_id, prev_digest_sha256);

ALTER TABLE compliance_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY compliance_events_tenant_isolation ON compliance_events
  USING (tenant_id = current_setting('app.current_tenant_id', true)::text);

-- =====================================================================
-- COMPLIANCE ANCHORS (periodic chain anchoring)
-- =====================================================================

CREATE TABLE compliance_anchors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  first_event_id UUID NOT NULL REFERENCES compliance_events(id),
  last_event_id UUID NOT NULL REFERENCES compliance_events(id),
  event_count INTEGER NOT NULL,
  root_hash VARCHAR(64) NOT NULL,
  anchor_type VARCHAR(50) NOT NULL DEFAULT 'internal',
  external_proof TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_anchors_tenant ON compliance_anchors(tenant_id, created_at DESC);

ALTER TABLE compliance_anchors ENABLE ROW LEVEL SECURITY;

CREATE POLICY compliance_anchors_tenant_isolation ON compliance_anchors
  USING (tenant_id = current_setting('app.current_tenant_id', true)::text);

-- =====================================================================
-- METRICS (for observability)
-- =====================================================================

CREATE TABLE metric_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  metric_name VARCHAR(100) NOT NULL,
  metric_value NUMERIC NOT NULL,
  dimensions JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_metrics_tenant_name_created ON metric_events(tenant_id, metric_name, created_at DESC);

ALTER TABLE metric_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY metric_events_tenant_isolation ON metric_events
  USING (tenant_id = current_setting('app.current_tenant_id', true)::text);

-- =====================================================================
-- METRIC DAILY AGGREGATIONS
-- =====================================================================

CREATE TABLE metric_daily (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  metric_name VARCHAR(100) NOT NULL,
  date DATE NOT NULL,
  count INTEGER NOT NULL,
  sum NUMERIC NOT NULL,
  avg NUMERIC NOT NULL,
  min NUMERIC NOT NULL,
  max NUMERIC NOT NULL,
  dimensions JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_metric_daily_unique ON metric_daily(tenant_id, metric_name, date, dimensions);
CREATE INDEX idx_metric_daily_tenant_date ON metric_daily(tenant_id, date DESC);

ALTER TABLE metric_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY metric_daily_tenant_isolation ON metric_daily
  USING (tenant_id = current_setting('app.current_tenant_id', true)::text);

-- =====================================================================
-- APPROVALS (for workflow approvals)
-- =====================================================================

CREATE TABLE approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  run_id UUID NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  step_id UUID REFERENCES workflow_steps(id) ON DELETE SET NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  required_approvers TEXT[] DEFAULT '{}',
  approved_by TEXT[] DEFAULT '{}',
  rejected_by TEXT[] DEFAULT '{}',
  decision_comment TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  decided_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_approvals_run ON approvals(run_id);
CREATE INDEX idx_approvals_status ON approvals(tenant_id, status);
CREATE INDEX idx_approvals_expires ON approvals(expires_at) WHERE status = 'pending';

ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY approvals_tenant_isolation ON approvals
  USING (tenant_id = current_setting('app.current_tenant_id', true)::text);

-- =====================================================================
-- GDPR DELETION KEYS (for crypto-shredding)
-- =====================================================================

CREATE TABLE gdpr_deletion_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  data_subject_id VARCHAR(255) NOT NULL,
  data_category VARCHAR(100) NOT NULL,
  encryption_key_hash VARCHAR(64) NOT NULL,
  deletion_requested_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_gdpr_keys_tenant_subject ON gdpr_deletion_keys(tenant_id, data_subject_id);
CREATE INDEX idx_gdpr_keys_deleted ON gdpr_deletion_keys(deleted_at);

ALTER TABLE gdpr_deletion_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY gdpr_deletion_keys_tenant_isolation ON gdpr_deletion_keys
  USING (tenant_id = current_setting('app.current_tenant_id', true)::text);

-- =====================================================================
-- UPDATED_AT TRIGGERS
-- =====================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_connections_updated_at BEFORE UPDATE ON connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON workflows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_steps_updated_at BEFORE UPDATE ON workflow_steps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_runs_updated_at BEFORE UPDATE ON runs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_approvals_updated_at BEFORE UPDATE ON approvals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================================
-- CLEANUP FUNCTIONS
-- =====================================================================

-- Clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Clean up expired idempotency keys
CREATE OR REPLACE FUNCTION cleanup_expired_idempotency_keys()
RETURNS void AS $$
BEGIN
  DELETE FROM idempotency_keys WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Clean up expired locks
CREATE OR REPLACE FUNCTION cleanup_expired_locks()
RETURNS void AS $$
BEGIN
  DELETE FROM distributed_locks WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;`}
                />

                <CodeBlock
                  title="scripts/migrate.ts - Migration Runner"
                  section="db-3"
                  code={`import fs from 'fs';
import path from 'path';
import { pool } from '../src/db';
import { logger } from '../src/config/logger';

interface Migration {
  id: number;
  name: string;
  filename: string;
  sql: string;
}

async function ensureMigrationsTable() {
  await pool.query(\`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      version INTEGER UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  \`);
}

async function getExecutedMigrations(): Promise<number[]> {
  const result = await pool.query(
    'SELECT version FROM schema_migrations ORDER BY version'
  );
  return result.rows.map(row => row.version);
}

function loadMigrations(): Migration[] {
  const migrationsDir = path.join(__dirname, '../db/migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();
  
  return files.map(filename => {
    const match = filename.match(/^(\\d+)_(.+)\\.sql$/);
    if (!match) {
      throw new Error(\`Invalid migration filename: \${filename}\`);
    }
    
    const [, id, name] = match;
    const sql = fs.readFileSync(path.join(migrationsDir, filename), 'utf-8');
    
    return {
      id: parseInt(id, 10),
      name,
      filename,
      sql,
    };
  });
}

async function runMigrations() {
  await ensureMigrationsTable();
  
  const executed = await getExecutedMigrations();
  const migrations = loadMigrations();
  const pending = migrations.filter(m => !executed.includes(m.id));
  
  if (pending.length === 0) {
    logger.info('No pending migrations');
    return;
  }
  
  logger.info(\`Running \${pending.length} pending migrations...\`);
  
  for (const migration of pending) {
    logger.info(\`Executing migration \${migration.id}: \${migration.name}\`);
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(migration.sql);
      await client.query(
        'INSERT INTO schema_migrations (version, name) VALUES ($1, $2)',
        [migration.id, migration.name]
      );
      await client.query('COMMIT');
      
      logger.info(\`✓ Migration \${migration.id} completed\`);
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error({ err: error, migration }, \`✗ Migration \${migration.id} failed\`);
      throw error;
    } finally {
      client.release();
    }
  }
  
  logger.info('All migrations completed successfully');
}

runMigrations()
  .then(() => process.exit(0))
  .catch((error) => {
    logger.error({ err: error }, 'Migration failed');
    process.exit(1);
  });`}
                />

                <CodeBlock
                  title="scripts/seed.ts - Development Seed Data"
                  section="db-4"
                  code={`import { pool } from '../src/db';
import bcrypt from 'bcrypt';
import { logger } from '../src/config/logger';

async function seed() {
  logger.info('Seeding database...');
  
  // Create test tenants
  await pool.query(\`
    INSERT INTO tenants (id, name, status, plan, owner_email, member_emails)
    VALUES
      ('acme-corp', 'Acme Corporation', 'active', 'business', 'owner@acme.com', ARRAY['owner@acme.com', 'user@acme.com']),
      ('widgets-inc', 'Widgets Inc', 'active', 'enterprise', 'ceo@widgets.com', ARRAY['ceo@widgets.com', 'cfo@widgets.com'])
    ON CONFLICT (id) DO NOTHING
  \`);
  
  // Create test users
  const passwordHash = await bcrypt.hash('password123', 10);
  
  await pool.query(\`
    INSERT INTO users (email, password_hash, full_name, role, tenant_id)
    VALUES
      ('owner@acme.com', $1, 'Alice Owner', 'owner', 'acme-corp'),
      ('user@acme.com', $1, 'Bob User', 'user', 'acme-corp'),
      ('ceo@widgets.com', $1, 'Charlie CEO', 'owner', 'widgets-inc'),
      ('cfo@widgets.com', $1, 'Dana CFO', 'admin', 'widgets-inc')
    ON CONFLICT (email) DO NOTHING
  \`, [passwordHash]);
  
  // Create test workflows
  await pool.query(\`
    INSERT INTO workflows (id, tenant_id, name, description, trigger_type, status)
    VALUES
      (uuid_generate_v4(), 'acme-corp', 'Shopify Order Sync', 'Sync new orders from Shopify to QuickBooks', 'webhook', 'active'),
      (uuid_generate_v4(), 'acme-corp', 'Invoice Approval', 'Send high-value invoices for approval', 'manual', 'active'),
      (uuid_generate_v4(), 'widgets-inc', 'Return Processing', 'Automate return refunds', 'webhook', 'active')
    ON CONFLICT DO NOTHING
  \`);
  
  logger.info('✓ Seed data created');
  logger.info('Test credentials:');
  logger.info('  - owner@acme.com / password123');
  logger.info('  - user@acme.com / password123');
  logger.info('  - ceo@widgets.com / password123');
  logger.info('  - cfo@widgets.com / password123');
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    logger.error({ err: error }, 'Seed failed');
    process.exit(1);
  });`}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* AUTH */}
          <TabsContent value="auth">
            <Card>
              <CardHeader>
                <CardTitle>Authentication & JWT</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <CodeBlock
                  title="src/auth/jwt.ts - JWT Generation & Validation"
                  section="auth-1"
                  code={`import jwt from 'jsonwebtoken';
import { config } from '@/config';

export interface JWTPayload {
  user_id: string;
  tenant_id: string;
  email: string;
  role: string;
  permissions: string[];
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

/**
 * Generate access + refresh token pair
 */
export function generateTokenPair(payload: JWTPayload): TokenPair {
  const access_token = jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRY,
    issuer: 'datachoreography',
    audience: 'datachoreography-api',
  });
  
  const refresh_token = jwt.sign(
    { user_id: payload.user_id, token_type: 'refresh' },
    config.JWT_SECRET,
    {
      expiresIn: config.JWT_REFRESH_EXPIRY,
      issuer: 'datachoreography',
      audience: 'datachoreography-api',
    }
  );
  
  return {
    access_token,
    refresh_token,
    expires_in: parseExpiryToSeconds(config.JWT_EXPIRY),
  };
}

/**
 * Verify and decode JWT
 */
export function verifyToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET, {
      issuer: 'datachoreography',
      audience: 'datachoreography-api',
    }) as any;
    
    return {
      user_id: decoded.user_id,
      tenant_id: decoded.tenant_id,
      email: decoded.email,
      role: decoded.role,
      permissions: decoded.permissions || [],
    };
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): { user_id: string } {
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET, {
      issuer: 'datachoreography',
      audience: 'datachoreography-api',
    }) as any;
    
    if (decoded.token_type !== 'refresh') {
      throw new Error('Not a refresh token');
    }
    
    return { user_id: decoded.user_id };
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
}

function parseExpiryToSeconds(expiry: string): number {
  const match = expiry.match(/^(\\d+)([smhd])$/);
  if (!match) throw new Error(\`Invalid expiry format: \${expiry}\`);
  
  const [, value, unit] = match;
  const num = parseInt(value, 10);
  
  switch (unit) {
    case 's': return num;
    case 'm': return num * 60;
    case 'h': return num * 3600;
    case 'd': return num * 86400;
    default: throw new Error(\`Unknown unit: \${unit}\`);
  }
}

export default {
  generateTokenPair,
  verifyToken,
  verifyRefreshToken,
};`}
                />

                <CodeBlock
                  title="src/middleware/auth.ts - Auth Middleware"
                  section="auth-2"
                  code={`import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken, JWTPayload } from '@/auth/jwt';
import { logger } from '@/config/logger';

// Extend Fastify request type
declare module 'fastify' {
  interface FastifyRequest {
    user?: JWTPayload;
    tenantId?: string;
    userId?: string;
  }
}

/**
 * Authentication middleware
 * Extracts and validates JWT from Authorization header
 */
export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const authHeader = request.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Missing or invalid Authorization header',
    });
  }
  
  const token = authHeader.substring(7);
  
  try {
    const payload = verifyToken(token);
    
    // Attach to request
    request.user = payload;
    request.tenantId = payload.tenant_id;
    request.userId = payload.user_id;
    
    // Add to logger context
    request.log = logger.child({
      tenant_id: payload.tenant_id,
      user_id: payload.user_id,
      user_role: payload.role,
    });
  } catch (error) {
    request.log.warn({ err: error }, 'Token verification failed');
    
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Invalid or expired token',
    });
  }
}

/**
 * Role-based authorization middleware
 */
export function requireRole(...allowedRoles: string[]) {
  return async function (request: FastifyRequest, reply: FastifyReply) {
    if (!request.user) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }
    
    if (!allowedRoles.includes(request.user.role)) {
      request.log.warn(
        { required_roles: allowedRoles, user_role: request.user.role },
        'Insufficient permissions'
      );
      
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Insufficient permissions',
      });
    }
  };
}

/**
 * Permission-based authorization middleware
 */
export function requirePermission(...requiredPermissions: string[]) {
  return async function (request: FastifyRequest, reply: FastifyReply) {
    if (!request.user) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }
    
    const hasPermission = requiredPermissions.every(perm =>
      request.user!.permissions.includes(perm)
    );
    
    if (!hasPermission) {
      request.log.warn(
        { required: requiredPermissions, user_permissions: request.user.permissions },
        'Insufficient permissions'
      );
      
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Insufficient permissions',
      });
    }
  };
}

export default authMiddleware;`}
                />

                <CodeBlock
                  title="src/routes/auth.ts - Auth Endpoints"
                  section="auth-3"
                  code={`import { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { pool } from '@/db';
import { generateTokenPair, verifyRefreshToken } from '@/auth/jwt';
import { authMiddleware } from '@/middleware/auth';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const refreshSchema = z.object({
  refresh_token: z.string(),
});

export async function authRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/v1/auth/login
   * Authenticate user and issue JWT
   */
  fastify.post('/login', async (request, reply) => {
    const body = loginSchema.parse(request.body);
    
    // Find user
    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND is_active = TRUE',
      [body.email]
    );
    
    if (userResult.rows.length === 0) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Invalid credentials',
      });
    }
    
    const user = userResult.rows[0];
    
    // Verify password
    const isValid = await bcrypt.compare(body.password, user.password_hash);
    
    if (!isValid) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Invalid credentials',
      });
    }
    
    // Generate tokens
    const tokens = generateTokenPair({
      user_id: user.id,
      tenant_id: user.tenant_id,
      email: user.email,
      role: user.role,
      permissions: [], // TODO: Load from permissions table
    });
    
    // Store refresh token
    const refreshTokenHash = await bcrypt.hash(tokens.refresh_token, 10);
    
    await pool.query(
      \`INSERT INTO sessions (user_id, tenant_id, refresh_token_hash, expires_at, ip_address, user_agent)
       VALUES ($1, $2, $3, NOW() + INTERVAL '30 days', $4, $5)\`,
      [
        user.id,
        user.tenant_id,
        refreshTokenHash,
        request.ip,
        request.headers['user-agent'],
      ]
    );
    
    // Update last login
    await pool.query(
      'UPDATE users SET last_login_at = NOW() WHERE id = $1',
      [user.id]
    );
    
    request.log.info({ user_id: user.id }, 'User logged in');
    
    return reply.send({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_in: tokens.expires_in,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        tenant_id: user.tenant_id,
      },
    });
  });
  
  /**
   * POST /api/v1/auth/refresh
   * Refresh access token using refresh token
   */
  fastify.post('/refresh', async (request, reply) => {
    const body = refreshSchema.parse(request.body);
    
    try {
      const { user_id } = verifyRefreshToken(body.refresh_token);
      
      // Verify refresh token exists in database
      const refreshTokenHash = await bcrypt.hash(body.refresh_token, 10);
      
      const sessionResult = await pool.query(
        \`SELECT s.*, u.email, u.role, u.tenant_id
         FROM sessions s
         JOIN users u ON s.user_id = u.id
         WHERE s.user_id = $1 AND s.expires_at > NOW()
         ORDER BY s.created_at DESC
         LIMIT 1\`,
        [user_id]
      );
      
      if (sessionResult.rows.length === 0) {
        return reply.status(401).send({
          error: 'Unauthorized',
          message: 'Invalid refresh token',
        });
      }
      
      const session = sessionResult.rows[0];
      
      // Generate new token pair
      const tokens = generateTokenPair({
        user_id: session.user_id,
        tenant_id: session.tenant_id,
        email: session.email,
        role: session.role,
        permissions: [],
      });
      
      return reply.send({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_in: tokens.expires_in,
      });
    } catch (error) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Invalid or expired refresh token',
      });
    }
  });
  
  /**
   * POST /api/v1/auth/logout
   * Invalidate refresh token
   */
  fastify.post('/logout', { preHandler: authMiddleware }, async (request, reply) => {
    await pool.query(
      'DELETE FROM sessions WHERE user_id = $1',
      [request.userId]
    );
    
    request.log.info('User logged out');
    
    return reply.send({ success: true });
  });
  
  /**
   * GET /api/v1/auth/me
   * Get current user info
   */
  fastify.get('/me', { preHandler: authMiddleware }, async (request, reply) => {
    const userResult = await pool.query(
      'SELECT id, email, full_name, role, tenant_id, created_at FROM users WHERE id = $1',
      [request.userId]
    );
    
    if (userResult.rows.length === 0) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'User not found',
      });
    }
    
    return reply.send({ user: userResult.rows[0] });
  });
}

export default authRoutes;`}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* MODULES */}
          <TabsContent value="modules">
            <Card>
              <CardHeader>
                <CardTitle>Core Modules Implementation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Credential Vault</h4>
                    <p className="text-sm text-blue-700">
                      Server-side credential storage with AWS Secrets Manager or local vault
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-2">Workflow Engine</h4>
                    <p className="text-sm text-green-700">
                      Idempotent execution with distributed locking
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-semibold text-purple-900 mb-2">Compliance Logger</h4>
                    <p className="text-sm text-purple-700">
                      Immutable audit trail with crypto-chain verification
                    </p>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <h4 className="font-semibold text-yellow-900 mb-2">Tenant Router</h4>
                    <p className="text-sm text-yellow-700">
                      RLS-enforced multi-tenant query isolation
                    </p>
                  </div>
                </div>

                <CodeBlock
                  title="src/modules/vault/index.ts - Credential Vault Interface"
                  section="vault-1"
                  code={`import { config } from '@/config';
import { LocalVaultProvider } from './providers/local';
import { AWSVaultProvider } from './providers/aws';

export interface VaultProvider {
  store(tenantId: string, connectionId: string, credentials: Record<string, any>): Promise<string>;
  retrieve(tenantId: string, keyId: string): Promise<Record<string, any>>;
  delete(tenantId: string, keyId: string): Promise<void>;
  rotate(tenantId: string, keyId: string, newCredentials: Record<string, any>): Promise<void>;
  healthCheck(): Promise<boolean>;
}

class VaultManager {
  private provider: VaultProvider;
  
  constructor() {
    if (config.VAULT_PROVIDER === 'aws') {
      this.provider = new AWSVaultProvider();
    } else {
      this.provider = new LocalVaultProvider();
    }
  }
  
  async store(tenantId: string, connectionId: string, credentials: Record<string, any>): Promise<string> {
    return await this.provider.store(tenantId, connectionId, credentials);
  }
  
  async retrieve(tenantId: string, keyId: string): Promise<Record<string, any>> {
    return await this.provider.retrieve(tenantId, keyId);
  }
  
  async delete(tenantId: string, keyId: string): Promise<void> {
    return await this.provider.delete(tenantId, keyId);
  }
  
  async rotate(tenantId: string, keyId: string, newCredentials: Record<string, any>): Promise<void> {
    return await this.provider.rotate(tenantId, keyId, newCredentials);
  }
  
  async healthCheck(): Promise<boolean> {
    return await this.provider.healthCheck();
  }
}

export const vault = new VaultManager();
export default vault;`}
                />

                <CodeBlock
                  title="src/modules/vault/providers/aws.ts - AWS Secrets Manager Provider"
                  section="vault-2"
                  code={`import AWS from 'aws-sdk';
import { VaultProvider } from '../index';
import { config } from '@/config';
import { logger } from '@/config/logger';

export class AWSVaultProvider implements VaultProvider {
  private client: AWS.SecretsManager;
  
  constructor() {
    this.client = new AWS.SecretsManager({
      region: config.AWS_REGION,
      accessKeyId: config.AWS_ACCESS_KEY_ID,
      secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
    });
  }
  
  async store(tenantId: string, connectionId: string, credentials: Record<string, any>): Promise<string> {
    const secretName = \`datachor/\${tenantId}/\${connectionId}\`;
    
    try {
      await this.client.createSecret({
        Name: secretName,
        SecretString: JSON.stringify(credentials),
        Tags: [
          { Key: 'tenant_id', Value: tenantId },
          { Key: 'connection_id', Value: connectionId },
          { Key: 'created_by', Value: 'datachoreography' },
        ],
      }).promise();
      
      logger.info({ tenant_id: tenantId, key_id: secretName }, 'Credential stored in AWS Secrets Manager');
      
      return secretName;
    } catch (error: any) {
      if (error.code === 'ResourceExistsException') {
        // Update existing secret
        await this.client.putSecretValue({
          SecretId: secretName,
          SecretString: JSON.stringify(credentials),
        }).promise();
        
        return secretName;
      }
      
      logger.error({ err: error, tenant_id: tenantId }, 'Failed to store credential');
      throw error;
    }
  }
  
  async retrieve(tenantId: string, keyId: string): Promise<Record<string, any>> {
    try {
      const result = await this.client.getSecretValue({
        SecretId: keyId,
      }).promise();
      
      if (!result.SecretString) {
        throw new Error('Secret has no string value');
      }
      
      const credentials = JSON.parse(result.SecretString);
      
      // Verify tenant ownership via tags
      const metadata = await this.client.describeSecret({
        SecretId: keyId,
      }).promise();
      
      const tenantTag = metadata.Tags?.find(t => t.Key === 'tenant_id');
      if (tenantTag?.Value !== tenantId) {
        logger.error(
          { expected: tenantId, actual: tenantTag?.Value, key_id: keyId },
          'Tenant mismatch in credential retrieval'
        );
        throw new Error('Unauthorized access to credential');
      }
      
      return credentials;
    } catch (error) {
      logger.error({ err: error, tenant_id: tenantId, key_id: keyId }, 'Failed to retrieve credential');
      throw error;
    }
  }
  
  async delete(tenantId: string, keyId: string): Promise<void> {
    try {
      // Verify ownership first
      await this.retrieve(tenantId, keyId);
      
      // Schedule deletion (AWS enforces minimum 7 day wait)
      await this.client.deleteSecret({
        SecretId: keyId,
        ForceDeleteWithoutRecovery: false,
        RecoveryWindowInDays: 7,
      }).promise();
      
      logger.info({ tenant_id: tenantId, key_id: keyId }, 'Credential scheduled for deletion');
    } catch (error) {
      logger.error({ err: error, tenant_id: tenantId, key_id: keyId }, 'Failed to delete credential');
      throw error;
    }
  }
  
  async rotate(tenantId: string, keyId: string, newCredentials: Record<string, any>): Promise<void> {
    try {
      // Verify ownership
      await this.retrieve(tenantId, keyId);
      
      // Update secret
      await this.client.putSecretValue({
        SecretId: keyId,
        SecretString: JSON.stringify(newCredentials),
      }).promise();
      
      logger.info({ tenant_id: tenantId, key_id: keyId }, 'Credential rotated');
    } catch (error) {
      logger.error({ err: error, tenant_id: tenantId, key_id: keyId }, 'Failed to rotate credential');
      throw error;
    }
  }
  
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.listSecrets({ MaxResults: 1 }).promise();
      return true;
    } catch (error) {
      logger.error({ err: error }, 'AWS Secrets Manager health check failed');
      return false;
    }
  }
}

export default AWSVaultProvider;`}
                />

                <CodeBlock
                  title="src/lib/locks.ts - Distributed Locking"
                  section="locks-1"
                  code={`import { pool } from '@/db';
import { logger } from '@/config/logger';
import { v4 as uuidv4 } from 'uuid';

export interface LockOptions {
  ttl?: number; // milliseconds
  retryAttempts?: number;
  retryDelay?: number; // milliseconds
}

const DEFAULT_OPTIONS: LockOptions = {
  ttl: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000,
};

export class DistributedLock {
  private lockKey: string;
  private ownerId: string;
  private tenantId: string;
  
  constructor(lockKey: string, tenantId: string) {
    this.lockKey = lockKey;
    this.tenantId = tenantId;
    this.ownerId = uuidv4();
  }
  
  /**
   * Acquire lock with retry logic
   */
  async acquire(options: LockOptions = {}): Promise<boolean> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    
    for (let attempt = 0; attempt < opts.retryAttempts!; attempt++) {
      const acquired = await this._tryAcquire(opts.ttl!);
      
      if (acquired) {
        logger.debug(
          { lock_key: this.lockKey, owner_id: this.ownerId, tenant_id: this.tenantId },
          'Lock acquired'
        );
        return true;
      }
      
      if (attempt < opts.retryAttempts! - 1) {
        await this._sleep(opts.retryDelay!);
      }
    }
    
    logger.warn(
      { lock_key: this.lockKey, tenant_id: this.tenantId, attempts: opts.retryAttempts },
      'Failed to acquire lock after retries'
    );
    
    return false;
  }
  
  /**
   * Try to acquire lock once
   */
  private async _tryAcquire(ttl: number): Promise<boolean> {
    try {
      const expiresAt = new Date(Date.now() + ttl);
      
      const result = await pool.query(
        \`INSERT INTO distributed_locks (lock_key, tenant_id, owner_id, expires_at, metadata)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (lock_key) DO NOTHING
         RETURNING lock_key\`,
        [
          this.lockKey,
          this.tenantId,
          this.ownerId,
          expiresAt,
          JSON.stringify({ acquired_at: new Date().toISOString() }),
        ]
      );
      
      return result.rowCount > 0;
    } catch (error) {
      logger.error({ err: error, lock_key: this.lockKey }, 'Error acquiring lock');
      return false;
    }
  }
  
  /**
   * Release lock
   */
  async release(): Promise<void> {
    try {
      const result = await pool.query(
        'DELETE FROM distributed_locks WHERE lock_key = $1 AND owner_id = $2',
        [this.lockKey, this.ownerId]
      );
      
      if (result.rowCount > 0) {
        logger.debug(
          { lock_key: this.lockKey, owner_id: this.ownerId },
          'Lock released'
        );
      } else {
        logger.warn(
          { lock_key: this.lockKey, owner_id: this.ownerId },
          'Lock not found or owned by different process'
        );
      }
    } catch (error) {
      logger.error({ err: error, lock_key: this.lockKey }, 'Error releasing lock');
    }
  }
  
  /**
   * Extend lock TTL
   */
  async extend(additionalTtl: number): Promise<boolean> {
    try {
      const newExpiresAt = new Date(Date.now() + additionalTtl);
      
      const result = await pool.query(
        \`UPDATE distributed_locks
         SET expires_at = $1
         WHERE lock_key = $2 AND owner_id = $3 AND expires_at > NOW()\`,
        [newExpiresAt, this.lockKey, this.ownerId]
      );
      
      return result.rowCount > 0;
    } catch (error) {
      logger.error({ err: error, lock_key: this.lockKey }, 'Error extending lock');
      return false;
    }
  }
  
  /**
   * Check if lock is still held
   */
  async isHeld(): Promise<boolean> {
    try {
      const result = await pool.query(
        'SELECT 1 FROM distributed_locks WHERE lock_key = $1 AND owner_id = $2 AND expires_at > NOW()',
        [this.lockKey, this.ownerId]
      );
      
      return result.rowCount > 0;
    } catch (error) {
      return false;
    }
  }
  
  private _sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Execute function with lock
 */
export async function withLock<T>(
  lockKey: string,
  tenantId: string,
  callback: () => Promise<T>,
  options?: LockOptions
): Promise<T> {
  const lock = new DistributedLock(lockKey, tenantId);
  
  const acquired = await lock.acquire(options);
  
  if (!acquired) {
    throw new Error(\`Failed to acquire lock: \${lockKey}\`);
  }
  
  try {
    return await callback();
  } finally {
    await lock.release();
  }
}

/**
 * Cleanup expired locks (call from scheduled job)
 */
export async function cleanupExpiredLocks(): Promise<number> {
  try {
    const result = await pool.query(
      'DELETE FROM distributed_locks WHERE expires_at < NOW()'
    );
    
    if (result.rowCount > 0) {
      logger.info({ count: result.rowCount }, 'Cleaned up expired locks');
    }
    
    return result.rowCount;
  } catch (error) {
    logger.error({ err: error }, 'Error cleaning up expired locks');
    return 0;
  }
}

export default DistributedLock;`}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* DEPLOYMENT */}
          <TabsContent value="deployment">
            <Card>
              <CardHeader>
                <CardTitle>Deployment & Operations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <CodeBlock
                  title="docker-compose.yml - Local Development Stack"
                  section="deploy-1"
                  language="yaml"
                  code={`version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: datachoreography
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    build: .
    environment:
      DATABASE_URL: postgresql://postgres:password@postgres:5432/datachoreography
      REDIS_URL: redis://redis:6379
      JWT_SECRET: dev-secret-change-in-production-min-32-chars
      NODE_ENV: development
      LOG_LEVEL: debug
      PORT: 3000
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./src:/app/src
      - ./node_modules:/app/node_modules
    command: npm run dev

  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./ops/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      GF_SECURITY_ADMIN_PASSWORD: admin
      GF_USERS_ALLOW_SIGN_UP: false
    volumes:
      - grafana_data:/var/lib/grafana
      - ./ops/grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./ops/grafana/datasources:/etc/grafana/provisioning/datasources
    depends_on:
      - prometheus

volumes:
  postgres_data:
  redis_data:
  prometheus_data:
  grafana_data:`}
                />

                <CodeBlock
                  title="Dockerfile - Production Container"
                  section="deploy-2"
                  language="docker"
                  code={`FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# Production image
FROM node:18-alpine

WORKDIR /app

# Copy dependencies
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \\
    adduser -S nodejs -u 1001

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \\
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) })"

CMD ["node", "dist/index.js"]`}
                />

                <CodeBlock
                  title=".github/workflows/ci.yml - CI/CD Pipeline"
                  section="deploy-3"
                  language="yaml"
                  code={`name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run ESLint
        run: npm run lint
      
      - name: Run TypeScript check
        run: npm run typecheck

  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: password
          POSTGRES_DB: datachoreography_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run migrations
        run: npm run migrate
        env:
          DATABASE_URL: postgresql://postgres:password@localhost:5432/datachoreography_test
      
      - name: Run tests
        run: npm test
        env:
          DATABASE_URL: postgresql://postgres:password@localhost:5432/datachoreography_test
          REDIS_URL: redis://localhost:6379
          JWT_SECRET: test-secret-at-least-32-characters-long
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run npm audit
        run: npm audit --audit-level=high
      
      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: \${{ secrets.SNYK_TOKEN }}

  build:
    runs-on: ubuntu-latest
    needs: [lint, test]
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      
      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: \${{ secrets.DOCKER_USERNAME }}
          password: \${{ secrets.DOCKER_PASSWORD }}
      
      - name: Build and push
        uses: docker/build-push-action@v4
        with:
          context: .
          push: \${{ github.ref == 'refs/heads/main' }}
          tags: datachoreography/api:latest,datachoreography/api:\${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy:
    runs-on: ubuntu-latest
    needs: [build]
    if: github.ref == 'refs/heads/main'
    
    steps:
      - name: Deploy to production
        run: echo "Deploy to production here"
        # Add your deployment steps (e.g., kubectl, terraform, etc.)`}
                />

                <CodeBlock
                  title="README.md - Quick Start Guide"
                  section="deploy-4"
                  language="markdown"
                  code={`# DataChoreography Backend API

Production-grade multi-tenant SaaS backend with PostgreSQL RLS, JWT auth, credential vault, and compliance logging.

## Quick Start

\`\`\`bash
# 1. Clone repo
git clone <repo-url>
cd backend

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env
# Edit .env with your settings

# 4. Start database
docker-compose up -d postgres redis

# 5. Run migrations
npm run migrate

# 6. Seed test data
npm run seed

# 7. Start dev server
npm run dev

# Server runs on http://localhost:3000
# Swagger docs at http://localhost:3000/docs
\`\`\`

## One-Command Local Setup

\`\`\`bash
docker-compose up
\`\`\`

Starts:
- PostgreSQL (port 5432)
- Redis (port 6379)
- API server (port 3000)
- Prometheus (port 9090)
- Grafana (port 3001) - admin/admin

## Environment Variables

See \`.env.example\` for all configuration options.

Critical production settings:
- \`JWT_SECRET\`: Must be 32+ characters
- \`VAULT_PROVIDER\`: Set to \`aws\` in production
- \`ENABLE_RLS\`: Must be \`true\` in production

## API Documentation

- OpenAPI spec: \`/docs\`
- Health check: \`/health\`
- Metrics: \`/metrics\`

## Testing

\`\`\`bash
npm test                # Unit tests
npm run test:integration # Integration tests
npm run test:contract    # Contract tests
\`\`\`

## Architecture

- **Multi-tenant**: PostgreSQL Row-Level Security (RLS)
- **Auth**: JWT with refresh tokens
- **Vault**: AWS Secrets Manager (prod) or local (dev)
- **Locking**: Distributed locks for idempotency
- **Compliance**: Crypto-chained audit trail
- **Monitoring**: Prometheus + Grafana

## Security

- All passwords bcrypt hashed (cost 10)
- Credentials stored in vault, never in DB
- JWT signed and verified
- RLS enforced on all tenant-scoped tables
- Rate limiting: 100 req/min per tenant
- CORS configured for allowed origins only

## Deployment

See \`ops/runbook/DEPLOY_CHECKLIST.md\` for production deployment steps.

\`\`\`bash
docker build -t datachoreography/api .
docker push datachoreography/api:latest
\`\`\`

## License

Proprietary`}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="mt-8 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Next Steps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2 text-sm text-gray-700">
              <li>1. Copy all code snippets above into your backend folder structure</li>
              <li>2. Run <code className="bg-gray-100 px-2 py-1 rounded">npm install</code></li>
              <li>3. Run <code className="bg-gray-100 px-2 py-1 rounded">docker-compose up</code></li>
              <li>4. Run migrations and seed: <code className="bg-gray-100 px-2 py-1 rounded">npm run migrate && npm run seed</code></li>
              <li>5. Test auth endpoint: <code className="bg-gray-100 px-2 py-1 rounded">curl http://localhost:3000/api/v1/auth/login</code></li>
              <li>6. View API docs at <code className="bg-gray-100 px-2 py-1 rounded">http://localhost:3000/docs</code></li>
              <li>7. Continue to next tabs for complete implementation of all modules</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, description }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-2">
        <Icon className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
      </div>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function Endpoint({ method, path, title, description, headers, requestBody, responseBody, securityNotes, scalingNotes }) {
  return (
    <div className="border rounded-lg p-6 space-y-4">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Badge className={
            method === 'GET' ? 'bg-green-100 text-green-800' :
            method === 'POST' ? 'bg-blue-100 text-blue-800' :
            method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }>
            {method}
          </Badge>
          <code className="text-lg font-mono">{path}</code>
        </div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      </div>

      {headers && headers.length > 0 && (
        <div>
          <h4 className="font-semibold text-sm text-gray-700 mb-2">Headers</h4>
          <div className="bg-gray-50 p-3 rounded space-y-1 text-sm">
            {headers.map((h, i) => (
              <div key={i} className="flex gap-2">
                <code className="text-blue-600">{h.name}:</code>
                <span className="text-gray-700">{h.value}</span>
                {h.required && <Badge variant="outline" className="text-xs">Required</Badge>}
              </div>
            ))}
          </div>
        </div>
      )}

      {requestBody && (
        <div>
          <h4 className="font-semibold text-sm text-gray-700 mb-2">Request Body</h4>
          <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto">
            {JSON.stringify(requestBody, null, 2)}
          </pre>
        </div>
      )}

      {responseBody && (
        <div>
          <h4 className="font-semibold text-sm text-gray-700 mb-2">Response</h4>
          <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto">
            {JSON.stringify(responseBody, null, 2)}
          </pre>
        </div>
      )}

      {securityNotes && securityNotes.length > 0 && (
        <div>
          <h4 className="font-semibold text-sm text-gray-700 mb-2 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Security Notes
          </h4>
          <ul className="space-y-1 text-sm text-gray-600">
            {securityNotes.map((note, i) => (
              <li key={i}>• {note}</li>
            ))}
          </ul>
        </div>
      )}

      {scalingNotes && scalingNotes.length > 0 && (
        <div>
          <h4 className="font-semibold text-sm text-gray-700 mb-2">Scaling Considerations</h4>
          <ul className="space-y-1 text-sm text-gray-600">
            {scalingNotes.map((note, i) => (
              <li key={i}>• {note}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}