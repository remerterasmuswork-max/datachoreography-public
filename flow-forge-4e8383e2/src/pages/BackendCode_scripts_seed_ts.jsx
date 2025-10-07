import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle } from 'lucide-react';

export default function BackendCode_scripts_seed_ts() {
  const [copied, setCopied] = React.useState(false);
  
  const code = `// PATH: scripts/seed.ts
import { db } from '../src/db.js';
import { tenants, users } from '../src/schema.js';
import { hashPassword } from '../src/security/hash.js';

async function seed() {
  console.log('🌱 Seeding database...');

  try {
    // Create tenants
    const [tenant1, tenant2] = await db
      .insert(tenants)
      .values([
        {
          name: 'Demo Corp',
          slug: 'demo-corp',
        },
        {
          name: 'Acme Inc',
          slug: 'acme-inc',
        },
      ])
      .returning();

    console.log(\`✅ Created \${2} tenants\`);

    // Create users
    const password1Hash = await hashPassword('password123');
    const password2Hash = await hashPassword('admin123');

    await db.insert(users).values([
      // Demo Corp users
      {
        tenantId: tenant1.id,
        email: 'admin@demo-corp.com',
        passwordHash: password2Hash,
        fullName: 'Demo Admin',
        role: 'admin',
      },
      {
        tenantId: tenant1.id,
        email: 'user@demo-corp.com',
        passwordHash: password1Hash,
        fullName: 'Demo User',
        role: 'user',
      },
      // Acme Inc users
      {
        tenantId: tenant2.id,
        email: 'admin@acme-inc.com',
        passwordHash: password2Hash,
        fullName: 'Acme Admin',
        role: 'admin',
      },
      {
        tenantId: tenant2.id,
        email: 'user@acme-inc.com',
        passwordHash: password1Hash,
        fullName: 'Acme User',
        role: 'user',
      },
    ]);

    console.log(\`✅ Created \${4} users\`);

    console.log('');
    console.log('📋 Login credentials:');
    console.log('');
    console.log('Demo Corp:');
    console.log('  Admin: admin@demo-corp.com / admin123');
    console.log('  User:  user@demo-corp.com / password123');
    console.log('');
    console.log('Acme Inc:');
    console.log('  Admin: admin@acme-inc.com / admin123');
    console.log('  User:  user@acme-inc.com / password123');
    console.log('');
    console.log('✅ Seed completed successfully');

  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

seed();`;

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
              <h2 className="text-lg font-mono text-gray-700">scripts/seed.ts</h2>
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