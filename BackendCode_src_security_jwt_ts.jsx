import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle } from 'lucide-react';

export default function BackendCode_src_security_jwt_ts() {
  const [copied, setCopied] = React.useState(false);
  
  const code = `// PATH: src/security/jwt.ts
import { SignJWT, jwtVerify } from 'jose';
import { getPrivateKey, getPublicKey } from './keys.js';

export interface JWTPayload {
  sub: string;        // user_id
  email: string;
  tenant_id: string;
  role: 'admin' | 'user';
  permissions?: string[];
  iat?: number;
  exp?: number;
}

export interface ImpersonationJWTPayload extends JWTPayload {
  impersonating: true;
  original_user_id: string;
  impersonation_session_id: string;
}

/**
 * Sign a JWT for a user
 * @param payload User information to encode
 * @param expiresIn Token expiry (default: 1 hour)
 */
export async function signJWT(
  payload: Omit<JWTPayload, 'iat' | 'exp'>,
  expiresIn: string = '1h'
): Promise<string> {
  const privateKey = getPrivateKey();

  const jwt = await new SignJWT(payload as any)
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(privateKey);

  return jwt;
}

/**
 * Sign an impersonation JWT (admin acting as another user)
 */
export async function signImpersonationJWT(
  adminUserId: string,
  targetUser: JWTPayload,
  sessionId: string,
  durationMinutes: number = 30
): Promise<string> {
  const privateKey = getPrivateKey();

  const payload: ImpersonationJWTPayload = {
    ...targetUser,
    impersonating: true,
    original_user_id: adminUserId,
    impersonation_session_id: sessionId,
  };

  const jwt = await new SignJWT(payload as any)
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime(\`\${durationMinutes}m\`)
    .sign(privateKey);

  return jwt;
}

/**
 * Verify and decode a JWT
 * @throws Error if token is invalid or expired
 */
export async function verifyJWT(token: string): Promise<JWTPayload> {
  const publicKey = getPublicKey();

  try {
    const { payload } = await jwtVerify(token, publicKey, {
      algorithms: ['RS256'],
    });

    return payload as JWTPayload;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(\`JWT verification failed: \${error.message}\`);
    }
    throw new Error('JWT verification failed');
  }
}

/**
 * Check if JWT payload represents an impersonation session
 */
export function isImpersonationToken(payload: JWTPayload): payload is ImpersonationJWTPayload {
  return 'impersonating' in payload && payload.impersonating === true;
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
              <h2 className="text-lg font-mono text-gray-700">src/security/jwt.ts</h2>
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