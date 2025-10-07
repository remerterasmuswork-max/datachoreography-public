import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle } from 'lucide-react';

export default function BackendCode_src_modules_vault_index_ts() {
  const [copied, setCopied] = React.useState(false);
  
  const code = `// PATH: src/modules/vault/index.ts
import AWS from 'aws-sdk';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const USE_AWS = process.env.VAULT_PROVIDER === 'aws';
const ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_KEY = process.env.VAULT_ENCRYPTION_KEY || randomBytes(32).toString('hex');

// AWS Secrets Manager client
const secretsManager = USE_AWS ? new AWS.SecretsManager({
  region: process.env.AWS_REGION || 'us-east-1',
}) : null;

// In-memory store for local development
const localVault = new Map<string, any>();

/**
 * Store credential in vault
 * @param tenantId Tenant ID for namespacing
 * @param connectionId Unique connection identifier
 * @param provider Provider name (shopify, stripe, etc.)
 * @param credentials Credential object to store
 */
export async function storeCredential(
  tenantId: string,
  connectionId: string,
  provider: string,
  credentials: Record<string, any>
): Promise<void> {
  const secretName = \`datachor/\${tenantId}/\${connectionId}\`;
  const secretValue = JSON.stringify({
    provider,
    credentials,
    created_at: new Date().toISOString(),
  });

  if (USE_AWS && secretsManager) {
    // Store in AWS Secrets Manager
    try {
      await secretsManager.createSecret({
        Name: secretName,
        SecretString: secretValue,
        Tags: [
          { Key: 'tenant_id', Value: tenantId },
          { Key: 'provider', Value: provider },
        ],
      }).promise();
    } catch (error: any) {
      if (error.code === 'ResourceExistsException') {
        // Update existing secret
        await secretsManager.updateSecret({
          SecretId: secretName,
          SecretString: secretValue,
        }).promise();
      } else {
        throw error;
      }
    }
  } else {
    // Store in local encrypted vault
    const encrypted = encrypt(secretValue);
    localVault.set(secretName, encrypted);
  }
}

/**
 * Retrieve credential from vault
 */
export async function getCredential(
  tenantId: string,
  connectionId: string
): Promise<Record<string, any>> {
  const secretName = \`datachor/\${tenantId}/\${connectionId}\`;

  let secretValue: string;

  if (USE_AWS && secretsManager) {
    const result = await secretsManager.getSecretValue({
      SecretId: secretName,
    }).promise();

    secretValue = result.SecretString!;
  } else {
    const encrypted = localVault.get(secretName);
    if (!encrypted) {
      throw new Error('Credential not found');
    }
    secretValue = decrypt(encrypted);
  }

  const parsed = JSON.parse(secretValue);
  return parsed.credentials;
}

/**
 * Delete credential from vault (crypto-shred)
 */
export async function deleteCredential(
  tenantId: string,
  connectionId: string
): Promise<void> {
  const secretName = \`datachor/\${tenantId}/\${connectionId}\`;

  if (USE_AWS && secretsManager) {
    await secretsManager.deleteSecret({
      SecretId: secretName,
      ForceDeleteWithoutRecovery: true,
    }).promise();
  } else {
    localVault.delete(secretName);
  }
}

/**
 * Test connection using stored credentials
 */
export async function testConnection(
  provider: string,
  credentials: Record<string, any>
): Promise<boolean> {
  // TODO: Implement provider-specific health checks
  // For now, just check if credentials exist
  switch (provider) {
    case 'shopify':
      return !!credentials.shop_domain && !!credentials.access_token;
    case 'stripe':
      return !!credentials.secret_key;
    case 'xero':
      return !!credentials.access_token && !!credentials.tenant_id;
    default:
      return Object.keys(credentials).length > 0;
  }
}

// =============================================================================
// LOCAL ENCRYPTION HELPERS
// =============================================================================

function encrypt(text: string): string {
  const iv = randomBytes(16);
  const key = Buffer.from(ENCRYPTION_KEY, 'hex');
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return \`\${iv.toString('hex')}:\${authTag.toString('hex')}:\${encrypted}\`;
}

function decrypt(encryptedData: string): string {
  const [ivHex, authTagHex, encryptedText] = encryptedData.split(':');

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const key = Buffer.from(ENCRYPTION_KEY, 'hex');

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
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
              <h2 className="text-lg font-mono text-gray-700">src/modules/vault/index.ts</h2>
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