import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle } from 'lucide-react';

export default function BackendCode_src_lib_idempotency_ts() {
  const [copied, setCopied] = React.useState(false);
  
  const code = `// PATH: src/lib/idempotency.ts
import { db } from '../db.js';
import { idempotencyKeys } from '../schema.js';
import { eq, and } from 'drizzle-orm';

interface IdempotencyResult {
  status_code: number;
  response_body: any;
}

/**
 * Check if an idempotency key has been used before
 * Returns the cached result if found
 */
export async function checkIdempotency(
  tenantId: string,
  key: string
): Promise<IdempotencyResult | null> {
  const [existing] = await db
    .select()
    .from(idempotencyKeys)
    .where(and(
      eq(idempotencyKeys.tenantId, tenantId),
      eq(idempotencyKeys.key, key)
    ))
    .limit(1);

  if (!existing) {
    return null;
  }

  return {
    status_code: existing.statusCode,
    response_body: existing.responseBody,
  };
}

/**
 * Store the result of an idempotent request
 */
export async function setIdempotencyResult(
  tenantId: string,
  key: string,
  statusCode: number,
  responseBody: any
): Promise<void> {
  try {
    await db
      .insert(idempotencyKeys)
      .values({
        tenantId,
        key,
        statusCode,
        responseBody,
      })
      .onConflictDoNothing(); // Handle race conditions gracefully
  } catch (error) {
    // Log but don't fail - idempotency is an optimization
    console.error('Failed to store idempotency result:', error);
  }
}

/**
 * Cleanup old idempotency keys (run as scheduled job)
 */
export async function cleanupOldIdempotencyKeys(
  olderThanDays: number = 7
): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

  const result = await db
    .delete(idempotencyKeys)
    .where(
      eq(idempotencyKeys.createdAt, cutoffDate)
    );

  // Return count of deleted records
  return result.rowCount || 0;
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
              <h2 className="text-lg font-mono text-gray-700">src/lib/idempotency.ts</h2>
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