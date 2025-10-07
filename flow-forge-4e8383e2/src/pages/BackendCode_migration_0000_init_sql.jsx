import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle } from 'lucide-react';

export default function BackendCode_migration_0000_init_sql() {
  const [copied, setCopied] = React.useState(false);
  
  const code = `-- PATH: drizzle/migrations/0000_init.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- TENANTS TABLE
-- =============================================================================

CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE INDEX idx_tenants_slug ON tenants(slug);

-- =============================================================================
-- USERS TABLE
-- =============================================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);

-- =============================================================================
-- CREDENTIALS TABLE (Vault References)
-- =============================================================================

CREATE TABLE credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  connection_id VARCHAR(255) NOT NULL,
  provider VARCHAR(50) NOT NULL CHECK (provider IN ('shopify', 'stripe', 'xero', 'gmail', 'msgraph', 'slack')),
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
  last_health_check TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  UNIQUE(tenant_id, connection_id)
);

CREATE INDEX idx_credentials_tenant_id ON credentials(tenant_id);
CREATE INDEX idx_credentials_connection_id ON credentials(connection_id);

-- =============================================================================
-- RUNS TABLE
-- =============================================================================

CREATE TABLE runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  workflow_id UUID NOT NULL,
  idempotency_key VARCHAR(255) NOT NULL,
  trigger_type VARCHAR(50) NOT NULL CHECK (trigger_type IN ('webhook', 'schedule', 'manual')),
  trigger_payload JSONB DEFAULT '{}',
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  correlation_id VARCHAR(255),
  locked_until TIMESTAMPTZ,
  locked_by VARCHAR(255),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  UNIQUE(tenant_id, idempotency_key)
);

CREATE INDEX idx_runs_tenant_id ON runs(tenant_id);
CREATE INDEX idx_runs_status ON runs(tenant_id, status);
CREATE INDEX idx_runs_workflow_id ON runs(tenant_id, workflow_id);
CREATE INDEX idx_runs_created_at ON runs(tenant_id, created_at DESC);
CREATE INDEX idx_runs_locked_until ON runs(locked_until) WHERE locked_until IS NOT NULL;

-- =============================================================================
-- RUN_LOGS TABLE
-- =============================================================================

CREATE TABLE run_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  run_id UUID NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  log_level VARCHAR(20) NOT NULL CHECK (log_level IN ('INFO', 'WARN', 'ERROR')),
  message TEXT NOT NULL,
  payload_json JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_run_logs_run_id ON run_logs(run_id);
CREATE INDEX idx_run_logs_tenant_timestamp ON run_logs(tenant_id, timestamp DESC);

-- =============================================================================
-- METRIC_EVENTS TABLE
-- =============================================================================

CREATE TABLE metric_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  metric_name VARCHAR(255) NOT NULL,
  metric_value NUMERIC NOT NULL,
  dimensions JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_metric_events_tenant ON metric_events(tenant_id, metric_name, timestamp DESC);
CREATE INDEX idx_metric_events_timestamp ON metric_events(timestamp DESC);

-- =============================================================================
-- COMPLIANCE_EVENTS TABLE (Audit Log with Hash Chain)
-- =============================================================================

CREATE TABLE compliance_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  ref_type VARCHAR(50),
  ref_id VARCHAR(255),
  actor VARCHAR(255) NOT NULL,
  actor_type VARCHAR(50) NOT NULL DEFAULT 'user',
  payload JSONB DEFAULT '{}',
  pii_redacted BOOLEAN NOT NULL DEFAULT TRUE,
  digest_sha256 VARCHAR(64) NOT NULL,
  prev_digest_sha256 VARCHAR(64),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_compliance_events_tenant ON compliance_events(tenant_id, timestamp DESC);
CREATE INDEX idx_compliance_events_digest ON compliance_events(digest_sha256);
CREATE INDEX idx_compliance_events_category ON compliance_events(tenant_id, category, timestamp DESC);

-- =============================================================================
-- COMPLIANCE_ANCHORS TABLE (Merkle Anchors)
-- =============================================================================

CREATE TABLE compliance_anchors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  period VARCHAR(50) NOT NULL,
  from_ts TIMESTAMPTZ NOT NULL,
  to_ts TIMESTAMPTZ NOT NULL,
  anchor_sha256 VARCHAR(64) NOT NULL,
  hmac_sha256 VARCHAR(64) NOT NULL,
  event_count INTEGER NOT NULL,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, period)
);

CREATE INDEX idx_compliance_anchors_tenant ON compliance_anchors(tenant_id, computed_at DESC);

-- =============================================================================
-- IDEMPOTENCY_KEYS TABLE
-- =============================================================================

CREATE TABLE idempotency_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  key VARCHAR(255) NOT NULL,
  status_code INTEGER NOT NULL,
  response_body JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, key)
);

CREATE INDEX idx_idempotency_keys_tenant ON idempotency_keys(tenant_id, key);
CREATE INDEX idx_idempotency_keys_created_at ON idempotency_keys(created_at);

-- =============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on all tenant-scoped tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE run_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE metric_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_anchors ENABLE ROW LEVEL SECURITY;
ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;

-- Create function to get current tenant from session
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS UUID AS $$
  SELECT NULLIF(current_setting('app.tenant_id', true), '')::UUID;
$$ LANGUAGE SQL STABLE;

-- RLS Policy: Only allow access to current tenant's data
CREATE POLICY tenant_isolation_policy ON tenants
  USING (id = current_tenant_id());

CREATE POLICY tenant_isolation_policy ON users
  USING (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation_policy ON credentials
  USING (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation_policy ON runs
  USING (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation_policy ON run_logs
  USING (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation_policy ON metric_events
  USING (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation_policy ON compliance_events
  USING (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation_policy ON compliance_anchors
  USING (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation_policy ON idempotency_keys
  USING (tenant_id = current_tenant_id());

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Function to cleanup old idempotency keys
CREATE OR REPLACE FUNCTION cleanup_old_idempotency_keys(older_than_days INTEGER DEFAULT 7)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM idempotency_keys
  WHERE created_at < NOW() - (older_than_days || ' days')::INTERVAL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup stale locks
CREATE OR REPLACE FUNCTION cleanup_stale_locks()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE runs
  SET locked_until = NULL, locked_by = NULL
  WHERE locked_until < NOW();
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;`;

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
              <h2 className="text-lg font-mono text-gray-700">drizzle/migrations/0000_init.sql</h2>
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