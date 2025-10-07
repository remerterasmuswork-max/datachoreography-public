import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle } from 'lucide-react';

export default function BackendCode_scripts_migrate_ts() {
  const [copied, setCopied] = React.useState(false);
  
  const code = `// PATH: scripts/migrate.ts
import postgres from 'postgres';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

const sql = postgres(DATABASE_URL);

async function runMigrations() {
  try {
    console.log('🚀 Starting database migrations...');

    // Create migrations table if it doesn't exist
    await sql\`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    \`;

    // Get list of executed migrations
    const executedMigrations = await sql\`
      SELECT name FROM migrations ORDER BY id
    \`;
    const executedNames = new Set(executedMigrations.map(m => m.name));

    // Read migration files
    const migrationsDir = join(process.cwd(), 'drizzle', 'migrations');
    const files = readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    console.log(\`📁 Found \${files.length} migration files\`);

    let appliedCount = 0;

    for (const file of files) {
      if (executedNames.has(file)) {
        console.log(\`⏭️  Skipping \${file} (already executed)\`);
        continue;
      }

      console.log(\`⚙️  Executing \${file}...\`);

      const filePath = join(migrationsDir, file);
      const migrationSQL = readFileSync(filePath, 'utf-8');

      // Execute migration in a transaction
      await sql.begin(async (tx) => {
        // Run migration SQL
        await tx.unsafe(migrationSQL);

        // Record migration
        await tx\`
          INSERT INTO migrations (name) VALUES (\${file})
        \`;
      });

      console.log(\`✅ Executed \${file}\`);
      appliedCount++;
    }

    if (appliedCount === 0) {
      console.log('✨ Database is up to date');
    } else {
      console.log(\`✅ Applied \${appliedCount} migrations\`);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

runMigrations();`;

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
              <h2 className="text-lg font-mono text-gray-700">scripts/migrate.ts</h2>
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