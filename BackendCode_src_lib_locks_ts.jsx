import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle } from 'lucide-react';

export default function BackendCode_src_lib_locks_ts() {
  const [copied, setCopied] = React.useState(false);
  
  const code = `// PATH: src/lib/locks.ts
import { db } from '../db.js';
import { runs } from '../schema.js';
import { eq, and, sql } from 'drizzle-orm';

const LOCK_TIMEOUT_MS = 30000; // 30 seconds

/**
 * Acquire a distributed lock on a run
 * Returns true if lock acquired, false if already locked
 */
export async function acquireLock(
  runId: string,
  workerId: string
): Promise<boolean> {
  const lockUntil = new Date(Date.now() + LOCK_TIMEOUT_MS);

  try {
    // Use optimistic locking - only update if not currently locked
    const result = await db
      .update(runs)
      .set({
        lockedUntil: lockUntil,
        lockedBy: workerId,
      })
      .where(and(
        eq(runs.id, runId),
        sql\`(locked_until IS NULL OR locked_until < NOW())\`
      ))
      .returning();

    // Lock acquired if we updated a row
    return result.length > 0;
  } catch (error) {
    console.error('Failed to acquire lock:', error);
    return false;
  }
}

/**
 * Release a lock on a run
 */
export async function releaseLock(
  runId: string,
  workerId: string
): Promise<void> {
  try {
    await db
      .update(runs)
      .set({
        lockedUntil: null,
        lockedBy: null,
      })
      .where(and(
        eq(runs.id, runId),
        eq(runs.lockedBy, workerId)
      ));
  } catch (error) {
    console.error('Failed to release lock:', error);
  }
}

/**
 * Extend a lock (if you need more time)
 */
export async function extendLock(
  runId: string,
  workerId: string,
  additionalMs: number = 30000
): Promise<boolean> {
  try {
    const newLockUntil = new Date(Date.now() + additionalMs);

    const result = await db
      .update(runs)
      .set({
        lockedUntil: newLockUntil,
      })
      .where(and(
        eq(runs.id, runId),
        eq(runs.lockedBy, workerId)
      ))
      .returning();

    return result.length > 0;
  } catch (error) {
    console.error('Failed to extend lock:', error);
    return false;
  }
}

/**
 * Cleanup stale locks (run as scheduled job)
 */
export async function cleanupStaleLocks(): Promise<number> {
  try {
    const result = await db
      .update(runs)
      .set({
        lockedUntil: null,
        lockedBy: null,
      })
      .where(sql\`locked_until < NOW()\`)
      .returning();

    return result.length;
  } catch (error) {
    console.error('Failed to cleanup stale locks:', error);
    return 0;
  }
}

/**
 * Check if a run is currently locked
 */
export async function isLocked(runId: string): Promise<boolean> {
  const [run] = await db
    .select()
    .from(runs)
    .where(eq(runs.id, runId))
    .limit(1);

  if (!run || !run.lockedUntil) {
    return false;
  }

  return new Date(run.lockedUntil) > new Date();
}`;

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
              <h2 className="text-lg font-mono text-gray-700">src/lib/locks.ts</h2>
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