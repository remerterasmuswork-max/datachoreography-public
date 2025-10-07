import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle } from 'lucide-react';

export default function BackendCode_src_schema_extended_ts() {
  const [copied, setCopied] = React.useState(false);
  
  const code = `// PATH: src/schema.ts (EXTENDED)
// Add these new tables to the existing schema.ts file

import { pgTable, text, timestamp, integer, boolean, jsonb, varchar, decimal, index, uniqueIndex } from 'drizzle-orm/pg-core';

// ========================================
// MARKETPLACE TEMPLATES
// ========================================

export const marketplaceTemplates = pgTable('marketplace_templates', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  templateId: text('template_id').notNull().unique(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  icon: text('icon'),
  category: text('category').notNull(), // finance, operations, compliance, customer
  complexity: text('complexity').notNull(), // low, medium, high
  version: text('version').notNull(), // semver
  publisherId: text('publisher_id').notNull(),
  publisherName: text('publisher_name').notNull(),
  verifiedPublisher: boolean('verified_publisher').default(false),
  featured: boolean('featured').default(false),
  
  // Requirements
  requiredConnections: jsonb('required_connections').$type<string[]>().notNull(),
  permissions: jsonb('permissions').$type<string[]>().notNull(),
  
  // Workflow Definition
  workflowJson: jsonb('workflow_json').notNull(),
  
  // GDPR
  gdprRequired: boolean('gdpr_required').default(false),
  gdprConfig: jsonb('gdpr_config').$type<{
    consent_needed: boolean;
    pii_fields_collected: string[];
    retention_days: number;
    purpose: string;
  }>(),
  
  // Metrics
  timeSavedPerRun: text('time_saved_per_run'),
  revenueImpactScore: integer('revenue_impact_score'),
  
  // Stats
  installCount: integer('install_count').default(0),
  rating: decimal('rating', { precision: 3, scale: 2 }).default('0'),
  reviewCount: integer('review_count').default(0),
  
  // Publishing
  status: text('status').notNull().default('draft'), // draft, under_review, approved, rejected, deprecated
  reviewedBy: text('reviewed_by'),
  reviewedAt: timestamp('reviewed_at'),
  rejectionReason: text('rejection_reason'),
  
  // Metadata
  tags: jsonb('tags').$type<string[]>(),
  changelog: jsonb('changelog').$type<Array<{
    version: string;
    date: string;
    title: string;
    changes: string[];
  }>>(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  publishedAt: timestamp('published_at'),
}, (table) => ({
  categoryIdx: index('marketplace_templates_category_idx').on(table.category),
  statusIdx: index('marketplace_templates_status_idx').on(table.status),
  publisherIdx: index('marketplace_templates_publisher_idx').on(table.publisherId),
  featuredIdx: index('marketplace_templates_featured_idx').on(table.featured),
}));

// ========================================
// TEMPLATE INSTALLATIONS
// ========================================

export const templateInstallations = pgTable('template_installations', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: text('tenant_id').notNull(),
  templateId: text('template_id').notNull(),
  version: text('version').notNull(),
  workflowId: text('workflow_id'), // Reference to created workflow
  
  status: text('status').notNull().default('installing'), // installing, active, failed, uninstalled
  installedBy: text('installed_by').notNull(),
  installedAt: timestamp('installed_at').defaultNow().notNull(),
  uninstalledAt: timestamp('uninstalled_at'),
  
  config: jsonb('config'), // User-specific configuration
  connectionMappings: jsonb('connection_mappings').$type<Record<string, string>>(), // provider -> connection_id
  
  // Metrics
  executionCount: integer('execution_count').default(0),
  lastExecutedAt: timestamp('last_executed_at'),
  successRate: decimal('success_rate', { precision: 5, scale: 2 }),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantTemplateIdx: uniqueIndex('template_installations_tenant_template_idx').on(table.tenantId, table.templateId),
  tenantIdx: index('template_installations_tenant_idx').on(table.tenantId),
  statusIdx: index('template_installations_status_idx').on(table.status),
}));

// ========================================
// PUBLISHER SUBMISSIONS
// ========================================

export const publisherSubmissions = pgTable('publisher_submissions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  submitterId: text('submitter_id').notNull(), // User ID
  submitterEmail: text('submitter_email').notNull(),
  
  templateData: jsonb('template_data').notNull(), // Full template manifest
  status: text('status').notNull().default('pending'), // pending, approved, rejected, changes_requested
  
  reviewedBy: text('reviewed_by'),
  reviewedAt: timestamp('reviewed_at'),
  reviewNotes: text('review_notes'),
  
  // Validation Results
  validationPassed: boolean('validation_passed'),
  validationErrors: jsonb('validation_errors').$type<string[]>(),
  
  // Hash for integrity
  manifestHash: text('manifest_hash').notNull(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  submitterIdx: index('publisher_submissions_submitter_idx').on(table.submitterId),
  statusIdx: index('publisher_submissions_status_idx').on(table.status),
}));

// ========================================
// METRIC AGGREGATIONS
// ========================================

export const metricAggregations = pgTable('metric_aggregations', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: text('tenant_id').notNull(),
  
  metricName: text('metric_name').notNull(), // hours_saved, tasks_automated, revenue_processed, success_rate
  period: text('period').notNull(), // daily, weekly, monthly
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),
  
  value: decimal('value', { precision: 15, scale: 2 }).notNull(),
  unit: text('unit'), // hours, count, currency, percentage
  
  dimensions: jsonb('dimensions').$type<Record<string, string>>(), // workflow_id, template_id, etc.
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  tenantMetricPeriodIdx: uniqueIndex('metric_aggregations_tenant_metric_period_idx')
    .on(table.tenantId, table.metricName, table.period, table.periodStart),
  tenantIdx: index('metric_aggregations_tenant_idx').on(table.tenantId),
}));

// ========================================
// GDPR DATA SUBJECTS
// ========================================

export const gdprDataSubjects = pgTable('gdpr_data_subjects', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: text('tenant_id').notNull(),
  
  email: text('email').notNull(),
  emailHash: text('email_hash').notNull(), // SHA-256 for lookup without storing plaintext
  
  // Consent
  consentGiven: boolean('consent_given').default(false),
  consentDate: timestamp('consent_date'),
  consentSource: text('consent_source'), // workflow_id or 'manual'
  
  // Data Processing
  piiFieldsProcessed: jsonb('pii_fields_processed').$type<string[]>(),
  lastProcessedAt: timestamp('last_processed_at'),
  processingPurpose: text('processing_purpose'),
  
  // Retention
  retentionDays: integer('retention_days').default(2555), // 7 years
  scheduledDeletionAt: timestamp('scheduled_deletion_at'),
  
  // Erasure
  erasureRequested: boolean('erasure_requested').default(false),
  erasureRequestedAt: timestamp('erasure_requested_at'),
  erasureCompletedAt: timestamp('erasure_completed_at'),
  erasureMethod: text('erasure_method'), // crypto_shredding, hard_delete
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  tenantEmailHashIdx: uniqueIndex('gdpr_data_subjects_tenant_email_hash_idx')
    .on(table.tenantId, table.emailHash),
  tenantIdx: index('gdpr_data_subjects_tenant_idx').on(table.tenantId),
  erasureRequestedIdx: index('gdpr_data_subjects_erasure_requested_idx').on(table.erasureRequested),
}));

// ========================================
// ENCRYPTION KEY METADATA
// ========================================

export const encryptionKeys = pgTable('encryption_keys', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: text('tenant_id').notNull(),
  
  keyId: text('key_id').notNull().unique(), // For key rotation
  keyType: text('key_type').notNull(), // master, data, credential
  
  // Key is stored in KMS/Vault, not in DB
  kmsKeyArn: text('kms_key_arn'),
  
  status: text('status').notNull().default('active'), // active, rotated, shredded
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  rotatedAt: timestamp('rotated_at'),
  shreddedAt: timestamp('shredded_at'),
}, (table) => ({
  tenantIdx: index('encryption_keys_tenant_idx').on(table.tenantId),
  statusIdx: index('encryption_keys_status_idx').on(table.status),
}));

// ========================================
// APPROVAL WORKFLOWS
// ========================================

export const approvalWorkflows = pgTable('approval_workflows', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  tenantId: text('tenant_id').notNull(),
  runId: text('run_id').notNull(),
  stepOrder: integer('step_order').notNull(),
  
  status: text('status').notNull().default('pending'), // pending, approved, rejected, expired
  
  requiredApprovers: jsonb('required_approvers').$type<string[]>(), // User IDs or roles
  approvedBy: text('approved_by'),
  approvedAt: timestamp('approved_at'),
  rejectedBy: text('rejected_by'),
  rejectedAt: timestamp('rejected_at'),
  
  reason: text('reason'),
  metadata: jsonb('metadata'), // Amount, risk score, etc.
  
  expiresAt: timestamp('expires_at'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  tenantRunIdx: index('approval_workflows_tenant_run_idx').on(table.tenantId, table.runId),
  statusIdx: index('approval_workflows_status_idx').on(table.status),
}));

// Export types
export type MarketplaceTemplate = typeof marketplaceTemplates.$inferSelect;
export type NewMarketplaceTemplate = typeof marketplaceTemplates.$inferInsert;
export type TemplateInstallation = typeof templateInstallations.$inferSelect;
export type PublisherSubmission = typeof publisherSubmissions.$inferSelect;
export type MetricAggregation = typeof metricAggregations.$inferSelect;
export type GdprDataSubject = typeof gdprDataSubjects.$inferSelect;`;

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
              <h2 className="text-lg font-mono text-gray-700">src/schema.ts (Extended)</h2>
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