import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle } from 'lucide-react';

export default function BackendCode_src_security_hash_ts() {
  const [copied, setCopied] = React.useState(false);
  
  const code = `// PATH: src/security/hash.ts
import bcrypt from 'bcryptjs';
import { randomBytes, createHash } from 'crypto';

const BCRYPT_ROUNDS = 12;
const HASH_PEPPER = process.env.HASH_PEPPER || '';

if (!HASH_PEPPER) {
  console.warn('⚠️  HASH_PEPPER not set - using empty string (NOT SECURE FOR PRODUCTION)');
}

/**
 * Hash a password with bcrypt + pepper
 */
export async function hashPassword(password: string): Promise<string> {
  // Apply pepper before bcrypt (defense in depth)
  const peppered = password + HASH_PEPPER;
  
  // Bcrypt with salt
  const hash = await bcrypt.hash(peppered, BCRYPT_ROUNDS);
  
  return hash;
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    const peppered = password + HASH_PEPPER;
    return await bcrypt.compare(peppered, hash);
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

/**
 * Generate a secure random token
 */
export function generateSecureToken(bytes: number = 32): string {
  return randomBytes(bytes).toString('hex');
}

/**
 * Hash data with SHA-256
 */
export function sha256(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

/**
 * Hash email for privacy (deterministic)
 */
export function hashEmail(email: string): string {
  return sha256(email.toLowerCase().trim());
}

/**
 * Constant-time string comparison (timing attack protection)
 */
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Generate a random API key
 */
export function generateApiKey(prefix: string = 'sk'): string {
  const token = generateSecureToken(32);
  return \`\${prefix}_\${token}\`;
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
              <h2 className="text-lg font-mono text-gray-700">src/security/hash.ts</h2>
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