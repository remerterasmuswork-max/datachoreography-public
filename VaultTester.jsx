import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, Loader, Key, Lock, Unlock } from 'lucide-react';
import { encryptCredential, decryptCredential, rotateCredential, testEncryption } from '../components/EncryptionVault';

export default function VaultTester() {
  const [plaintext, setPlaintext] = useState('');
  const [encrypted, setEncrypted] = useState('');
  const [decrypted, setDecrypted] = useState('');
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleEncrypt = async () => {
    setLoading(true);
    try {
      const result = await encryptCredential(plaintext);
      setEncrypted(result);
      setDecrypted('');
    } catch (error) {
      alert('Encryption failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDecrypt = async () => {
    setLoading(true);
    try {
      const result = await decryptCredential(encrypted);
      setDecrypted(result);
    } catch (error) {
      alert('Decryption failed: ' + error.message);
      setDecrypted('❌ Decryption failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRotate = async () => {
    setLoading(true);
    try {
      const result = await rotateCredential(encrypted);
      setEncrypted(result);
      alert('Credential rotated successfully (re-encrypted with new IV)');
    } catch (error) {
      alert('Rotation failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const runFullTest = async () => {
    setLoading(true);
    setTestResult(null);
    
    try {
      const result = await testEncryption();
      setTestResult(result);
    } catch (error) {
      setTestResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-6 h-6" />
              Credential Vault Tester
            </CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Test AES-256-GCM encryption for secure credential storage
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Quick Test */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-indigo-900">Quick Round-Trip Test</h3>
                  <p className="text-sm text-indigo-700">Verify encryption integrity</p>
                </div>
                <Button onClick={runFullTest} disabled={loading}>
                  {loading ? <Loader className="w-4 h-4 animate-spin" /> : 'Run Test'}
                </Button>
              </div>

              {testResult && (
                <div className={`p-4 rounded-lg ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {testResult.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    <span className={`font-semibold ${testResult.success ? 'text-green-900' : 'text-red-900'}`}>
                      {testResult.success ? 'Encryption Working Correctly' : 'Encryption Failed'}
                    </span>
                  </div>
                  
                  {testResult.success && (
                    <div className="text-sm space-y-1 text-green-800">
                      <div><strong>Original:</strong> {testResult.original}</div>
                      <div><strong>Encrypted:</strong> {testResult.encrypted}</div>
                      <div><strong>Decrypted:</strong> {testResult.decrypted}</div>
                      <div className="text-green-600 font-medium mt-2">✓ Match confirmed</div>
                    </div>
                  )}
                  
                  {!testResult.success && (
                    <div className="text-sm text-red-800">
                      <strong>Error:</strong> {testResult.error}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Manual Test */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Plaintext Input */}
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <Unlock className="w-4 h-4" />
                  Plaintext
                </label>
                <Textarea
                  value={plaintext}
                  onChange={(e) => setPlaintext(e.target.value)}
                  placeholder="Enter API key, token, or secret..."
                  rows={6}
                  className="font-mono text-sm"
                />
                <Button
                  onClick={handleEncrypt}
                  disabled={!plaintext || loading}
                  className="w-full mt-2"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Encrypt →
                </Button>
              </div>

              {/* Encrypted Value */}
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Encrypted (IV:Ciphertext)
                </label>
                <Textarea
                  value={encrypted}
                  onChange={(e) => setEncrypted(e.target.value)}
                  placeholder="Encrypted value will appear here..."
                  rows={6}
                  className="font-mono text-sm bg-gray-50"
                />
                <div className="flex gap-2 mt-2">
                  <Button
                    onClick={handleDecrypt}
                    disabled={!encrypted || loading}
                    variant="outline"
                    className="flex-1"
                  >
                    <Unlock className="w-4 h-4 mr-2" />
                    Decrypt →
                  </Button>
                  <Button
                    onClick={handleRotate}
                    disabled={!encrypted || loading}
                    variant="outline"
                  >
                    Rotate
                  </Button>
                </div>
              </div>

              {/* Decrypted Result */}
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <Unlock className="w-4 h-4" />
                  Decrypted Result
                </label>
                <Textarea
                  value={decrypted}
                  readOnly
                  placeholder="Decrypted value will appear here..."
                  rows={6}
                  className="font-mono text-sm bg-gray-50"
                />
                {decrypted && plaintext && (
                  <div className="mt-2">
                    {decrypted === plaintext ? (
                      <div className="flex items-center gap-2 text-green-600 text-sm">
                        <CheckCircle className="w-4 h-4" />
                        <span>Match confirmed</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-red-600 text-sm">
                        <XCircle className="w-4 h-4" />
                        <span>Mismatch! Decryption failed</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Technical Details */}
            <div className="border-t pt-6">
              <h3 className="font-semibold mb-3">Technical Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Algorithm:</strong> AES-256-GCM
                </div>
                <div>
                  <strong>Key Derivation:</strong> PBKDF2 (100,000 iterations)
                </div>
                <div>
                  <strong>IV Length:</strong> 96 bits (12 bytes)
                </div>
                <div>
                  <strong>Auth Tag:</strong> 128 bits (16 bytes)
                </div>
                <div>
                  <strong>Encoding:</strong> Base64
                </div>
                <div>
                  <strong>Format:</strong> {'{iv}:{ciphertext+tag}'}
                </div>
              </div>
            </div>

            {/* Sample Credentials */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-900 mb-2">Sample Credentials to Test</h4>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>Shopify:</strong>{' '}
                  <button
                    onClick={() => setPlaintext('shpat_abc123def456ghi789jkl012')}
                    className="text-indigo-600 hover:underline"
                  >
                    Use Sample
                  </button>
                </div>
                <div>
                  <strong>Stripe:</strong>{' '}
                  <button
                    onClick={() => setPlaintext('sk_test_51A2B3C4D5E6F7G8H9I0J1K2L3')}
                    className="text-indigo-600 hover:underline"
                  >
                    Use Sample
                  </button>
                </div>
                <div>
                  <strong>Xero:</strong>{' '}
                  <button
                    onClick={() => setPlaintext('eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...')}
                    className="text-indigo-600 hover:underline"
                  >
                    Use Sample
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Integration Example */}
        <Card>
          <CardHeader>
            <CardTitle>Integration Example</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
{`import { encryptCredential, decryptCredential } from '@/components/EncryptionVault';
import { Credential } from '@/api/entities';

// Storing a credential
const apiKey = 'shpat_abc123...';
const encrypted = await encryptCredential(apiKey);

await Credential.create({
  connection_id: conn.id,
  encrypted_value: encrypted,
  credential_type: 'api_key'
});

// Retrieving a credential
const cred = await Credential.get(credentialId);
const apiKey = await decryptCredential(cred.encrypted_value);

// Use apiKey for API call...`}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}