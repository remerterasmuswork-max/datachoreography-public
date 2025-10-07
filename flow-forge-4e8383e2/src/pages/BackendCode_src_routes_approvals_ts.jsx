import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle } from 'lucide-react';

export default function BackendCode_src_routes_approvals_ts() {
  const [copied, setCopied] = React.useState(false);
  
  const code = `// PATH: src/routes/approvals.ts
import { Router } from 'express';
import { db } from '../db.js';
import { approvalWorkflows, runs } from '../schema.js';
import { authMiddleware } from '../middleware/auth.js';
import { rlsMiddleware } from '../middleware/rls.js';
import { eq, and, desc, or } from 'drizzle-orm';

const router = Router();

// ========================================
// PROTECTED: List Pending Approvals
// ========================================

router.get('/pending', authMiddleware, rlsMiddleware, async (req, res) => {
  try {
    const tenantId = req.rlsContext.tenantId;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Get pending approvals where user is eligible
    const approvals = await db
      .select({
        approval: approvalWorkflows,
        run: runs,
      })
      .from(approvalWorkflows)
      .leftJoin(runs, eq(approvalWorkflows.runId, runs.id))
      .where(
        and(
          eq(approvalWorkflows.tenantId, tenantId),
          eq(approvalWorkflows.status, 'pending'),
          // User is in required approvers list
          // In real impl, would check if userId or userRole is in requiredApprovers
        )
      )
      .orderBy(desc(approvalWorkflows.createdAt));

    res.json({
      approvals: approvals.map(({ approval, run }) => ({
        id: approval.id,
        run_id: approval.runId,
        step_order: approval.stepOrder,
        status: approval.status,
        metadata: approval.metadata,
        expires_at: approval.expiresAt,
        created_at: approval.createdAt,
        workflow_name: run?.workflowId,
      })),
    });
  } catch (error) {
    console.error('Failed to fetch pending approvals:', error);
    res.status(500).json({ error: 'Failed to fetch approvals' });
  }
});

// ========================================
// PROTECTED: Approve Request
// ========================================

router.post('/:approvalId/approve', authMiddleware, rlsMiddleware, async (req, res) => {
  try {
    const { approvalId } = req.params;
    const { reason } = req.body;
    const tenantId = req.rlsContext.tenantId;
    const userId = req.user.id;

    // Get approval
    const [approval] = await db
      .select()
      .from(approvalWorkflows)
      .where(
        and(
          eq(approvalWorkflows.id, approvalId),
          eq(approvalWorkflows.tenantId, tenantId),
          eq(approvalWorkflows.status, 'pending')
        )
      )
      .limit(1);

    if (!approval) {
      return res.status(404).json({ error: 'Approval not found or already processed' });
    }

    // Check if user is authorized to approve
    const requiredApprovers = approval.requiredApprovers as string[];
    if (!requiredApprovers.includes(userId) && !requiredApprovers.includes(req.user.role)) {
      return res.status(403).json({ error: 'Not authorized to approve this request' });
    }

    // Update approval
    await db
      .update(approvalWorkflows)
      .set({
        status: 'approved',
        approvedBy: userId,
        approvedAt: new Date(),
        reason,
      })
      .where(eq(approvalWorkflows.id, approvalId));

    // Resume workflow run
    await db
      .update(runs)
      .set({
        status: 'running',
      })
      .where(
        and(
          eq(runs.id, approval.runId),
          eq(runs.status, 'awaiting_approval')
        )
      );

    res.json({ message: 'Approval granted, workflow resumed' });
  } catch (error) {
    console.error('Failed to approve request:', error);
    res.status(500).json({ error: 'Failed to approve request' });
  }
});

// ========================================
// PROTECTED: Reject Request
// ========================================

router.post('/:approvalId/reject', authMiddleware, rlsMiddleware, async (req, res) => {
  try {
    const { approvalId } = req.params;
    const { reason } = req.body;
    const tenantId = req.rlsContext.tenantId;
    const userId = req.user.id;

    if (!reason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    // Get approval
    const [approval] = await db
      .select()
      .from(approvalWorkflows)
      .where(
        and(
          eq(approvalWorkflows.id, approvalId),
          eq(approvalWorkflows.tenantId, tenantId),
          eq(approvalWorkflows.status, 'pending')
        )
      )
      .limit(1);

    if (!approval) {
      return res.status(404).json({ error: 'Approval not found or already processed' });
    }

    // Check authorization
    const requiredApprovers = approval.requiredApprovers as string[];
    if (!requiredApprovers.includes(userId) && !requiredApprovers.includes(req.user.role)) {
      return res.status(403).json({ error: 'Not authorized to reject this request' });
    }

    // Update approval
    await db
      .update(approvalWorkflows)
      .set({
        status: 'rejected',
        rejectedBy: userId,
        rejectedAt: new Date(),
        reason,
      })
      .where(eq(approvalWorkflows.id, approvalId));

    // Cancel workflow run
    await db
      .update(runs)
      .set({
        status: 'cancelled',
        errorMessage: \`Rejected by approver: \${reason}\`,
        finishedAt: new Date(),
      })
      .where(eq(runs.id, approval.runId));

    res.json({ message: 'Request rejected, workflow cancelled' });
  } catch (error) {
    console.error('Failed to reject request:', error);
    res.status(500).json({ error: 'Failed to reject request' });
  }
});

// ========================================
// PROTECTED: Get Approval History
// ========================================

router.get('/history', authMiddleware, rlsMiddleware, async (req, res) => {
  try {
    const tenantId = req.rlsContext.tenantId;
    const { limit = 50 } = req.query;

    const approvals = await db
      .select()
      .from(approvalWorkflows)
      .where(
        and(
          eq(approvalWorkflows.tenantId, tenantId),
          or(
            eq(approvalWorkflows.status, 'approved'),
            eq(approvalWorkflows.status, 'rejected')
          )
        )
      )
      .orderBy(desc(approvalWorkflows.createdAt))
      .limit(parseInt(limit as string));

    res.json({ approvals });
  } catch (error) {
    console.error('Failed to fetch approval history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
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
              <h2 className="text-lg font-mono text-gray-700">src/routes/approvals.ts</h2>
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