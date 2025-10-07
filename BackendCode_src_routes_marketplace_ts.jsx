import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle } from 'lucide-react';

export default function BackendCode_src_routes_marketplace_ts() {
  const [copied, setCopied] = React.useState(false);
  
  const code = `// PATH: src/routes/marketplace.ts
import { Router } from 'express';
import { db } from '../db.js';
import { marketplaceTemplates, templateInstallations } from '../schema.js';
import { authMiddleware } from '../middleware/auth.js';
import { rlsMiddleware } from '../middleware/rls.js';
import { eq, and, desc, sql, like, inArray } from 'drizzle-orm';
import crypto from 'crypto';

const router = Router();

// ========================================
// PUBLIC: Browse Templates
// ========================================

router.get('/templates', async (req, res) => {
  try {
    const { category, search, sort = 'popular', status = 'approved' } = req.query;

    let query = db
      .select()
      .from(marketplaceTemplates)
      .where(eq(marketplaceTemplates.status, status as string))
      .$dynamic();

    // Filter by category
    if (category && category !== 'all') {
      query = query.where(eq(marketplaceTemplates.category, category as string));
    }

    // Search
    if (search) {
      query = query.where(
        sql\`(
          \${marketplaceTemplates.name} ILIKE \${sql.raw(\`'%\${search}%'\`)} OR
          \${marketplaceTemplates.description} ILIKE \${sql.raw(\`'%\${search}%'\`)} OR
          \${marketplaceTemplates.tags}::text ILIKE \${sql.raw(\`'%\${search}%'\`)}
        )\`
      );
    }

    // Sort
    switch (sort) {
      case 'rating':
        query = query.orderBy(desc(marketplaceTemplates.rating));
        break;
      case 'installs':
        query = query.orderBy(desc(marketplaceTemplates.installCount));
        break;
      case 'recent':
        query = query.orderBy(desc(marketplaceTemplates.publishedAt));
        break;
      default: // popular
        query = query.orderBy(
          desc(marketplaceTemplates.featured),
          desc(marketplaceTemplates.installCount),
          desc(marketplaceTemplates.rating)
        );
    }

    const templates = await query.limit(50);

    res.json({
      templates,
      total: templates.length,
    });
  } catch (error) {
    console.error('Failed to fetch templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// ========================================
// PUBLIC: Get Template Details
// ========================================

router.get('/templates/:templateId', async (req, res) => {
  try {
    const { templateId } = req.params;

    const [template] = await db
      .select()
      .from(marketplaceTemplates)
      .where(eq(marketplaceTemplates.templateId, templateId))
      .limit(1);

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(template);
  } catch (error) {
    console.error('Failed to fetch template:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

// ========================================
// PROTECTED: Install Template
// ========================================

router.post('/templates/:templateId/install', authMiddleware, rlsMiddleware, async (req, res) => {
  try {
    const { templateId } = req.params;
    const { connectionMappings, config } = req.body;
    const tenantId = req.rlsContext.tenantId;
    const userId = req.user.id;

    // Get template
    const [template] = await db
      .select()
      .from(marketplaceTemplates)
      .where(
        and(
          eq(marketplaceTemplates.templateId, templateId),
          eq(marketplaceTemplates.status, 'approved')
        )
      )
      .limit(1);

    if (!template) {
      return res.status(404).json({ error: 'Template not found or not approved' });
    }

    // Check if already installed
    const [existing] = await db
      .select()
      .from(templateInstallations)
      .where(
        and(
          eq(templateInstallations.tenantId, tenantId),
          eq(templateInstallations.templateId, templateId),
          eq(templateInstallations.status, 'active')
        )
      )
      .limit(1);

    if (existing) {
      return res.status(400).json({ error: 'Template already installed' });
    }

    // Validate connection mappings
    const requiredConnections = template.requiredConnections as string[];
    for (const conn of requiredConnections) {
      if (!connectionMappings[conn]) {
        return res.status(400).json({
          error: \`Missing connection mapping for: \${conn}\`,
        });
      }
    }

    // Create installation record
    const [installation] = await db
      .insert(templateInstallations)
      .values({
        tenantId,
        templateId: template.templateId,
        version: template.version,
        status: 'installing',
        installedBy: userId,
        connectionMappings,
        config,
      })
      .returning();

    // TODO: Create workflow from template.workflowJson
    // TODO: Create workflow steps
    // TODO: Link connections
    // TODO: Update installation status to 'active'

    // Increment install count
    await db
      .update(marketplaceTemplates)
      .set({
        installCount: sql\`\${marketplaceTemplates.installCount} + 1\`,
      })
      .where(eq(marketplaceTemplates.id, template.id));

    res.json({
      installation,
      message: 'Template installed successfully',
    });
  } catch (error) {
    console.error('Failed to install template:', error);
    res.status(500).json({ error: 'Failed to install template' });
  }
});

// ========================================
// PROTECTED: List My Installations
// ========================================

router.get('/installations', authMiddleware, rlsMiddleware, async (req, res) => {
  try {
    const tenantId = req.rlsContext.tenantId;

    const installations = await db
      .select({
        installation: templateInstallations,
        template: marketplaceTemplates,
      })
      .from(templateInstallations)
      .leftJoin(
        marketplaceTemplates,
        eq(templateInstallations.templateId, marketplaceTemplates.templateId)
      )
      .where(eq(templateInstallations.tenantId, tenantId))
      .orderBy(desc(templateInstallations.installedAt));

    res.json({ installations });
  } catch (error) {
    console.error('Failed to fetch installations:', error);
    res.status(500).json({ error: 'Failed to fetch installations' });
  }
});

// ========================================
// PROTECTED: Uninstall Template
// ========================================

router.delete('/installations/:installationId', authMiddleware, rlsMiddleware, async (req, res) => {
  try {
    const { installationId } = req.params;
    const tenantId = req.rlsContext.tenantId;

    // Verify ownership
    const [installation] = await db
      .select()
      .from(templateInstallations)
      .where(
        and(
          eq(templateInstallations.id, installationId),
          eq(templateInstallations.tenantId, tenantId)
        )
      )
      .limit(1);

    if (!installation) {
      return res.status(404).json({ error: 'Installation not found' });
    }

    // Mark as uninstalled
    await db
      .update(templateInstallations)
      .set({
        status: 'uninstalled',
        uninstalledAt: new Date(),
      })
      .where(eq(templateInstallations.id, installationId));

    // TODO: Disable/delete associated workflow
    // TODO: Clean up workflow steps
    // TODO: Revoke connections if not used elsewhere

    res.json({ message: 'Template uninstalled successfully' });
  } catch (error) {
    console.error('Failed to uninstall template:', error);
    res.status(500).json({ error: 'Failed to uninstall template' });
  }
});

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
              <h2 className="text-lg font-mono text-gray-700">src/routes/marketplace.ts</h2>
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