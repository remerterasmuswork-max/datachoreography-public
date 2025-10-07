/**
 * EncryptionVault: Client-side AES-256-GCM encryption for credentials
 * Uses Web Crypto API (SubtleCrypto) for secure encryption
 */

// In production, load from Base44 secrets or environment
// For now, generate a consistent key from a secret
const ENCRYPTION_SECRET = 'datachor_master_key_v1_change_in_production';

let cachedKey = null;

async function getMasterKey() {
  if (cachedKey) return cachedKey;
  
  // Derive key from secret using PBKDF2
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(ENCRYPTION_SECRET),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
  
  cachedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('datachor_salt'), // In production, use random salt per tenant
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
  
  return cachedKey;
}

/**
 * Encrypt credential data
 * Returns: {iv}:{ciphertext}:{authTag} as base64
 */
export async function encryptCredential(plaintext) {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);
    
    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    const key = await getMasterKey();
    
    // Encrypt with AES-GCM
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
        tagLength: 128
      },
      key,
      data
    );
    
    // Convert to base64
    const encryptedArray = new Uint8Array(encrypted);
    const ivBase64 = btoa(String.fromCharCode(...iv));
    const ciphertextBase64 = btoa(String.fromCharCode(...encryptedArray));
    
    // Format: iv:ciphertext (auth tag is included in ciphertext by AES-GCM)
    return `${ivBase64}:${ciphertextBase64}`;
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt credential');
  }
}

/**
 * Decrypt credential data
 * Input: {iv}:{ciphertext}:{authTag} as base64
 */
export async function decryptCredential(encrypted) {
  try {
    const parts = encrypted.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted format');
    }
    
    const [ivBase64, ciphertextBase64] = parts;
    
    // Decode from base64
    const iv = new Uint8Array(atob(ivBase64).split('').map(c => c.charCodeAt(0)));
    const ciphertext = new Uint8Array(atob(ciphertextBase64).split('').map(c => c.charCodeAt(0)));
    
    const key = await getMasterKey();
    
    // Decrypt with AES-GCM
    const decrypted = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
        tagLength: 128
      },
      key,
      ciphertext
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt credential - may be corrupted or tampered');
  }
}

/**
 * Rotate credential (re-encrypt with new IV)
 */
export async function rotateCredential(encrypted) {
  const plaintext = await decryptCredential(encrypted);
  return await encryptCredential(plaintext);
}

/**
 * Test encryption round-trip
 */
export async function testEncryption() {
  const testData = 'test_credential_' + Date.now();
  const encrypted = await encryptCredential(testData);
  const decrypted = await decryptCredential(encrypted);
  return {
    success: testData === decrypted,
    original: testData,
    encrypted: encrypted.substring(0, 50) + '...',
    decrypted: decrypted
  };
}

export default { encryptCredential, decryptCredential, rotateCredential, testEncryption };