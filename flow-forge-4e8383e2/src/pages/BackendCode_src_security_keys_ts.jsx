import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle } from 'lucide-react';

export default function BackendCode_src_security_keys_ts() {
  const [copied, setCopied] = React.useState(false);
  
  const code = `// PATH: src/security/keys.ts
import { importPKCS8, importSPKI } from 'jose';

let privateKey: CryptoKey | null = null;
let publicKey: CryptoKey | null = null;

export async function loadKeys(): Promise<void> {
  const privateKeyB64 = process.env.JWT_PRIVATE_KEY_BASE64;
  const publicKeyB64 = process.env.JWT_PUBLIC_KEY_BASE64;

  if (!privateKeyB64 || !publicKeyB64) {
    throw new Error('JWT_PRIVATE_KEY_BASE64 and JWT_PUBLIC_KEY_BASE64 must be set in environment');
  }

  try {
    // Decode base64 to PEM format
    const privateKeyPem = Buffer.from(privateKeyB64, 'base64').toString('utf-8');
    const publicKeyPem = Buffer.from(publicKeyB64, 'base64').toString('utf-8');

    // Import keys
    privateKey = await importPKCS8(privateKeyPem, 'RS256');
    publicKey = await importSPKI(publicKeyPem, 'RS256');

    console.log('✓ JWT keys loaded successfully');
  } catch (error) {
    console.error('Failed to load JWT keys:', error);
    throw new Error('Invalid JWT key format. See .env.example for key generation instructions.');
  }
}

export function getPrivateKey(): CryptoKey {
  if (!privateKey) {
    throw new Error('Private key not loaded. Call loadKeys() first.');
  }
  return privateKey;
}

export function getPublicKey(): CryptoKey {
  if (!publicKey) {
    throw new Error('Public key not loaded. Call loadKeys() first.');
  }
  return publicKey;
}

// Initialize keys on module load
await loadKeys();`;

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
              <h2 className="text-lg font-mono text-gray-700">src/security/keys.ts</h2>
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