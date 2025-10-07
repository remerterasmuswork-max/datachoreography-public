import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle } from 'lucide-react';

export default function BackendCode_package_json() {
  const [copied, setCopied] = React.useState(false);
  
  const code = `// PATH: package.json
{
  "name": "datachoreography-backend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch --clear-screen=false src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "tsx scripts/migrate.ts",
    "db:seed": "tsx scripts/seed.ts",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src --ext .ts"
  },
  "dependencies": {
    "@fastify/cors": "^9.0.1",
    "fastify": "^4.26.2",
    "drizzle-orm": "^0.30.4",
    "postgres": "^3.4.3",
    "jose": "^5.2.2",
    "bcryptjs": "^2.4.3",
    "zod": "^3.22.4",
    "pino": "^8.19.0",
    "pino-pretty": "^10.3.1",
    "ioredis": "^5.3.2",
    "undici": "^6.6.2"
  },
  "devDependencies": {
    "@types/node": "^20.11.20",
    "@types/bcryptjs": "^2.4.6",
    "typescript": "^5.3.3",
    "tsx": "^4.7.1",
    "drizzle-kit": "^0.20.14",
    "vitest": "^1.3.1",
    "@vitest/ui": "^1.3.1",
    "eslint": "^8.56.0",
    "@typescript-eslint/eslint-plugin": "^6.21.0",
    "@typescript-eslint/parser": "^6.21.0"
  },
  "engines": {
    "node": ">=18.0.0"
  }
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
              <h2 className="text-lg font-mono text-gray-700">package.json</h2>
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