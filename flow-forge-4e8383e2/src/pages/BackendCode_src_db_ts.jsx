import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle } from 'lucide-react';

export default function BackendCode_src_db_ts() {
  const [copied, setCopied] = React.useState(false);
  
  const code = `// PATH: src/db.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

const connectionString = process.env.DATABASE_URL!;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Create postgres client
const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

// Create drizzle instance
export const db = drizzle(client, { schema });

/**
 * Execute a query within a tenant context
 * Sets the app.tenant_id session variable for RLS enforcement
 */
export async function withTenant<T>(
  tenantId: string,
  callback: () => Promise<T>
): Promise<T> {
  // Use a transaction to ensure session variable is scoped
  return await db.transaction(async (tx) => {
    // Set tenant context for RLS
    await tx.execute(\`SET LOCAL app.tenant_id = '\${tenantId}'\`);
    
    // Execute callback
    return await callback();
  });
}

/**
 * Health check - verify database connection
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await client\`SELECT 1\`;
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

/**
 * Close database connection (for graceful shutdown)
 */
export async function closeDatabaseConnection(): Promise<void> {
  await client.end();
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
              <h2 className="text-lg font-mono text-gray-700">src/db.ts</h2>
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