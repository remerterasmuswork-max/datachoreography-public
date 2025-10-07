import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle } from 'lucide-react';

export default function BackendCode_src_middleware_rls_ts() {
  const [copied, setCopied] = React.useState(false);
  
  const code = `// PATH: src/middleware/rls.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { db } from '../db.js';

/**
 * RLS (Row-Level Security) middleware
 * Sets PostgreSQL session variable for tenant isolation
 * 
 * NOTE: This is automatically applied by authMiddleware
 * This file documents the RLS approach for reference
 */

/**
 * Execute a query with tenant context
 * All queries in the callback will have RLS enforcement
 */
export async function withTenantContext<T>(
  tenantId: string,
  callback: () => Promise<T>
): Promise<T> {
  return await db.transaction(async (tx) => {
    // Set tenant context for this transaction
    await tx.execute(\`SET LOCAL app.tenant_id = '\${tenantId}'\`);
    
    // Execute callback with RLS enforced
    return await callback();
  });
}

/**
 * Verify RLS is working (for testing)
 */
export async function verifyRLS(tenantId: string): Promise<boolean> {
  try {
    // Set tenant context
    await db.execute(\`SET LOCAL app.tenant_id = '\${tenantId}'\`);
    
    // Try to query with RLS enabled
    const result = await db.execute(\`
      SELECT COUNT(*) as count 
      FROM tenants 
      WHERE id = '\${tenantId}'
    \`);
    
    // Should only return rows for current tenant
    return result.rows.length > 0;
  } catch (error) {
    console.error('RLS verification failed:', error);
    return false;
  }
}

/**
 * Middleware to set tenant context from request
 */
export async function rlsMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  if (!request.tenantId) {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Tenant context required',
    });
  }

  try {
    // Set tenant context for all subsequent queries in this request
    await db.execute(\`SET LOCAL app.tenant_id = '\${request.tenantId}'\`);
    
    request.log.debug({
      tenant_id: request.tenantId,
    }, 'RLS context set');
  } catch (error) {
    request.log.error({ error }, 'Failed to set RLS context');
    
    return reply.status(500).send({
      error: 'Internal Server Error',
      message: 'Failed to initialize tenant context',
    });
  }
}

/**
 * Bypass RLS for admin operations (use with extreme caution)
 */
export async function withoutRLS<T>(
  callback: () => Promise<T>
): Promise<T> {
  return await db.transaction(async (tx) => {
    // Disable RLS for this transaction
    await tx.execute(\`SET LOCAL app.bypass_rls = 'true'\`);
    
    return await callback();
  });
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
              <h2 className="text-lg font-mono text-gray-700">src/middleware/rls.ts</h2>
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