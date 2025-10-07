import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle } from 'lucide-react';

export default function BackendCode_env_example() {
  const [copied, setCopied] = React.useState(false);
  
  const code = `# PATH: .env.example

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/datachoreography

# Redis (optional - gracefully degrades if not available)
REDIS_URL=redis://localhost:6379

# JWT RS256 Keys
# Generate with:
#   openssl genrsa -out private.pem 2048
#   openssl rsa -in private.pem -pubout -out public.pem
#   openssl pkcs8 -topk8 -inform PEM -outform PEM -in private.pem -out private.pk8.pem -nocrypt
#   cat private.pk8.pem | base64 -w 0
#   cat public.pem | base64 -w 0
JWT_PRIVATE_KEY_BASE64=<base64-encoded-pkcs8-private-key>
JWT_PUBLIC_KEY_BASE64=<base64-encoded-spki-public-key>

# Password Hashing Pepper (random string, min 32 chars)
HASH_PEPPER=<random-32-plus-character-secret>

# Server
PORT=3000
NODE_ENV=development
LOG_LEVEL=info

# Security
CORS_ORIGIN=http://localhost:3001,https://app.datachoreography.com

# Feature Flags
ENABLE_REDIS=true
ENABLE_RATE_LIMIT=true`;

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
              <h2 className="text-lg font-mono text-gray-700">.env.example</h2>
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