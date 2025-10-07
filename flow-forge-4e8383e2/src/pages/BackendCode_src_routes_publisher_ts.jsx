import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle } from 'lucide-react';

export default function BackendCode_src_routes_publisher_ts() {
  const [copied, setCopied] = React.useState(false);
  
  const code = `// PATH: src/routes/publisher.ts
import { Router } from 'express';
import { db } from '../db.js';
import { publisherSubmissions, marketplaceTemplates } from '../schema.js';
import { authMiddleware } from '../middleware/auth.js';
import { eq, and, desc } from 'drizzle-orm';
import crypto from 'crypto';

const router = Router();

// ========================================
// PROTECTED: Submit Template
// ========================================

router.post('/submit', authMiddleware, async (req, res) => {
  try {
    const { templateData } = req.body;
    const userId = req.user.id;
    const userEmail = req.user.email;

    // Validate template structure
    const validation = validateTemplateManifest(templateData);
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Invalid template manifest',
        errors: validation.errors,
      });
    }

    // Create manifest hash
    const manifestHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(templateData))
      .digest('hex');

    // Create submission
    const [submission] = await db
      .insert(publisherSubmissions)
      .values({
        submitterId: userId,
        submitterEmail: userEmail,
        templateData,
        manifestHash,
        validationPassed: true,
        status: 'pending',
      })
      .returning();

    res.json({
      submission,
      message: 'Template submitted for review',
    });
  } catch (error) {
    console.error('Failed to submit template:', error);
    res.status(500).json({ error: 'Failed to submit template' });
  }
});

// ========================================
// PROTECTED: List My Submissions
// ========================================

router.get('/submissions', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const submissions = await db
      .select()
      .from(publisherSubmissions)
      .where(eq(publisherSubmissions.submitterId, userId))
      .orderBy(desc(publisherSubmissions.createdAt));

    res.json({ submissions });
  } catch (error) {
    console.error('Failed to fetch submissions:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// ========================================
// ADMIN: List All Pending Submissions
// ========================================

router.get('/admin/submissions', authMiddleware, async (req, res) => {
  try {
    // Verify admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { status = 'pending' } = req.query;

    const submissions = await db
      .select()
      .from(publisherSubmissions)
      .where(eq(publisherSubmissions.status, status as string))
      .orderBy(desc(publisherSubmissions.createdAt));

    res.json({ submissions });
  } catch (error) {
    console.error('Failed to fetch submissions:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// ========================================
// ADMIN: Review Submission
// ========================================

router.post('/admin/submissions/:submissionId/review', authMiddleware, async (req, res) => {
  try {
    // Verify admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { submissionId } = req.params;
    const { action, notes } = req.body; // 'approve', 'reject', 'request_changes'

    const [submission] = await db
      .select()
      .from(publisherSubmissions)
      .where(eq(publisherSubmissions.id, submissionId))
      .limit(1);

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    if (action === 'approve') {
      // Create marketplace template
      const templateData = submission.templateData as any;
      
      await db.insert(marketplaceTemplates).values({
        templateId: templateData.template_id,
        name: templateData.name,
        description: templateData.description,
        icon: templateData.icon,
        category: templateData.category,
        complexity: templateData.complexity,
        version: templateData.version,
        publisherId: submission.submitterId,
        publisherName: submission.submitterEmail.split('@')[0],
        verifiedPublisher: false,
        requiredConnections: templateData.required_connections,
        permissions: templateData.permissions,
        workflowJson: templateData.workflow_json,
        gdprRequired: templateData.gdpr?.required || false,
        gdprConfig: templateData.gdpr,
        timeSavedPerRun: templateData.metrics?.time_saved_per_run,
        revenueImpactScore: templateData.metrics?.revenue_impact_score,
        tags: templateData.tags,
        changelog: templateData.changelog,
        status: 'approved',
        reviewedBy: req.user.id,
        reviewedAt: new Date(),
        publishedAt: new Date(),
      });

      // Update submission
      await db
        .update(publisherSubmissions)
        .set({
          status: 'approved',
          reviewedBy: req.user.id,
          reviewedAt: new Date(),
          reviewNotes: notes,
        })
        .where(eq(publisherSubmissions.id, submissionId));

      return res.json({ message: 'Template approved and published' });
    }

    if (action === 'reject') {
      await db
        .update(publisherSubmissions)
        .set({
          status: 'rejected',
          reviewedBy: req.user.id,
          reviewedAt: new Date(),
          reviewNotes: notes,
        })
        .where(eq(publisherSubmissions.id, submissionId));

      return res.json({ message: 'Template rejected' });
    }

    if (action === 'request_changes') {
      await db
        .update(publisherSubmissions)
        .set({
          status: 'changes_requested',
          reviewedBy: req.user.id,
          reviewedAt: new Date(),
          reviewNotes: notes,
        })
        .where(eq(publisherSubmissions.id, submissionId));

      return res.json({ message: 'Changes requested' });
    }

    res.status(400).json({ error: 'Invalid action' });
  } catch (error) {
    console.error('Failed to review submission:', error);
    res.status(500).json({ error: 'Failed to review submission' });
  }
});

// ========================================
// Template Manifest Validator
// ========================================

function validateTemplateManifest(manifest: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Required fields
  const required = [
    'template_id',
    'name',
    'description',
    'category',
    'complexity',
    'version',
    'required_connections',
    'permissions',
    'workflow_json',
  ];

  for (const field of required) {
    if (!manifest[field]) {
      errors.push(\`Missing required field: \${field}\`);
    }
  }

  // Validate workflow JSON structure
  if (manifest.workflow_json) {
    if (!manifest.workflow_json.trigger) {
      errors.push('workflow_json must have a trigger');
    }
    if (!Array.isArray(manifest.workflow_json.steps)) {
      errors.push('workflow_json.steps must be an array');
    }
  }

  // Validate GDPR if processing PII
  if (manifest.gdpr && manifest.gdpr.pii_fields_collected?.length > 0) {
    if (!manifest.gdpr.retention_days) {
      errors.push('GDPR: retention_days required when collecting PII');
    }
    if (manifest.gdpr.consent_needed === undefined) {
      errors.push('GDPR: consent_needed must be specified');
    }
  }

  // Validate version (semver)
  if (manifest.version && !/^\d+\.\d+\.\d+$/.test(manifest.version)) {
    errors.push('Version must follow semantic versioning (x.y.z)');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export default router;`;

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
              <h2 className="text-lg font-mono text-gray-700">src/routes/publisher.ts</h2>
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