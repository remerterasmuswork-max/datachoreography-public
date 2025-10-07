import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle } from 'lucide-react';

export default function BackendCode_src_schema_ts() {
  const [copied, setCopied] = React.useState(false);
  
  const code = `// PATH: src/schema.ts
import { pgTable, uuid, varchar, timestamp, text, jsonb, boolean, integer, index } from 'drizzle-orm/pg-core';

// =============================================================================
// TENANTS
// =============================================================================

export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  status: varchar('status', { length: 50 }).notNull().default('trial'),
  plan: varchar('plan', { length: 50 }).notNull().default('starter'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// =============================================================================
// USERS
// =============================================================================

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  fullName: varchar('full_name', { length: 255 }),
  role: varchar('role', { length: 50 }).notNull().default('user'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  tenantIdIdx: index('users_tenant_id_idx').on(table.tenantId),
  emailIdx: index('users_email_idx').on(table.email),
}));

// =============================================================================
// CREDENTIALS (vault references only)
// =============================================================================

export const credentials = pgTable('credentials', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  connectionId: varchar('connection_id', { length: 255 }).notNull(),
  provider: varchar('provider', { length: 50 }).notNull(),
  status: varchar('status', { length: 50 }).notNull().default('active'),
  lastHealthCheck: timestamp('last_health_check'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  tenantIdIdx: index('credentials_tenant_id_idx').on(table.tenantId),
  connectionIdIdx: index('credentials_connection_id_idx').on(table.connectionId),
}));

// =============================================================================
// RUNS
// =============================================================================

export const runs = pgTable('runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  workflowId: uuid('workflow_id').notNull(),
  idempotencyKey: varchar('idempotency_key', { length: 255 }),
  triggerType: varchar('trigger_type', { length: 50 }).notNull(),
  triggerPayload: jsonb('trigger_payload'),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  currentStepOrder: integer('current_step_order').notNull().default(0),
  correlationId: varchar('correlation_id', { length: 255 }),
  startedAt: timestamp('started_at').defaultNow(),
  finishedAt: timestamp('finished_at'),
  durationMs: integer('duration_ms'),
  errorMessage: text('error_message'),
  context: jsonb('context'),
  lockedUntil: timestamp('locked_until'),
  lockedBy: varchar('locked_by', { length: 255 }),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  tenantIdIdx: index('runs_tenant_id_idx').on(table.tenantId),
  statusIdx: index('runs_status_idx').on(table.status),
  tenantStatusIdx: index('runs_tenant_status_idx').on(table.tenantId, table.status),
  tenantCreatedIdx: index('runs_tenant_created_idx').on(table.tenantId, table.createdAt),
  idempotencyIdx: index('runs_idempotency_idx').on(table.tenantId, table.idempotencyKey),
}));

// =============================================================================
// RUN LOGS
// =============================================================================

export const runLogs = pgTable('run_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  runId: uuid('run_id').notNull().references(() => runs.id, { onDelete: 'cascade' }),
  logLevel: varchar('log_level', { length: 20 }).notNull(),
  message: text('message').notNull(),
  payloadJson: jsonb('payload_json'),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
}, (table) => ({
  tenantRunIdx: index('run_logs_tenant_run_idx').on(table.tenantId, table.runId),
  timestampIdx: index('run_logs_timestamp_idx').on(table.timestamp),
}));

// =============================================================================
// IDEMPOTENCY KEYS
// =============================================================================

export const idempotencyKeys = pgTable('idempotency_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  key: varchar('key', { length: 255 }).notNull(),
  statusCode: integer('status_code').notNull(),
  responseBody: jsonb('response_body'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  tenantKeyIdx: index('idempotency_keys_tenant_key_idx').on(table.tenantId, table.key),
}));

// =============================================================================
// METRIC EVENTS
// =============================================================================

export const metricEvents = pgTable('metric_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  metricName: varchar('metric_name', { length: 255 }).notNull(),
  metricValue: integer('metric_value').notNull(),
  dimensions: jsonb('dimensions'),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
}, (table) => ({
  tenantMetricIdx: index('metric_events_tenant_metric_idx').on(table.tenantId, table.metricName),
  tenantTsIdx: index('metric_events_tenant_ts_idx').on(table.tenantId, table.timestamp),
}));

// =============================================================================
// COMPLIANCE EVENTS
// =============================================================================

export const complianceEvents = pgTable('compliance_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  category: varchar('category', { length: 50 }).notNull(),
  eventType: varchar('event_type', { length: 100 }).notNull(),
  refType: varchar('ref_type', { length: 50 }),
  refId: varchar('ref_id', { length: 255 }),
  actor: varchar('actor', { length: 255 }).notNull(),
  actorType: varchar('actor_type', { length: 50 }).notNull().default('user'),
  payload: jsonb('payload'),
  piiRedacted: boolean('pii_redacted').notNull().default(true),
  digestSha256: varchar('digest_sha256', { length: 64 }).notNull(),
  prevDigestSha256: varchar('prev_digest_sha256', { length: 64 }),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
}, (table) => ({
  tenantCategoryIdx: index('compliance_events_tenant_category_idx').on(table.tenantId, table.category),
  tenantTsIdx: index('compliance_events_tenant_ts_idx').on(table.tenantId, table.timestamp),
  digestIdx: index('compliance_events_digest_idx').on(table.digestSha256),
}));

// =============================================================================
// COMPLIANCE ANCHORS
// =============================================================================

export const complianceAnchors = pgTable('compliance_anchors', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  period: varchar('period', { length: 20 }).notNull(),
  fromTs: timestamp('from_ts').notNull(),
  toTs: timestamp('to_ts').notNull(),
  anchorSha256: varchar('anchor_sha256', { length: 64 }).notNull(),
  hmacSha256: varchar('hmac_sha256', { length: 64 }).notNull(),
  eventCount: integer('event_count').notNull(),
  computedAt: timestamp('computed_at').notNull().defaultNow(),
}, (table) => ({
  tenantPeriodIdx: index('compliance_anchors_tenant_period_idx').on(table.tenantId, table.period),
}));

// =============================================================================
// ENCRYPTION KEYS (for crypto-shredding)
// =============================================================================

export const encryptionKeys = pgTable('encryption_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  purpose: varchar('purpose', { length: 100 }).notNull(),
  keyHash: varchar('key_hash', { length: 64 }).notNull(),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  tenantPurposeIdx: index('encryption_keys_tenant_purpose_idx').on(table.tenantId, table.purpose),
}));`;

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
              <h2 className="text-lg font-mono text-gray-700">src/schema.ts</h2>
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