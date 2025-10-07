import React from 'react';

/**
 * AES-256-GCM Encryption/Decryption using Web Crypto API
 * Format: IV:TAG:CIPHERTEXT (all base64 encoded)
 */

// In production, load this from Base44 secrets or secure key management
const MASTER_KEY_B64 = 'REPLACE_WITH_SECURE_KEY'; // 32 bytes base64

async function getMasterKey() {
  // In production: fetch from secure storage
  // For now: derive from environment or hardcoded (INSECURE FOR DEMO ONLY)
  const keyMaterial = new TextEncoder().encode(MASTER_KEY_B64);
  const key = await crypto.subtle.importKey(
    'raw',
    keyMaterial.slice(0, 32),
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
  return key;
}

export async function encryptCredential(plaintext) {
  try {
    const key = await getMasterKey();
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV
    const encoded = new TextEncoder().encode(plaintext);
    
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv, tagLength: 128 },
      key,
      encoded
    );
    
    // Format: IV:CIPHERTEXT (tag is included in ciphertext by GCM)
    const ivB64 = btoa(String.fromCharCode(...iv));
    const ciphertextB64 = btoa(String.fromCharCode(...new Uint8Array(ciphertext)));
    
    return `${ivB64}:${ciphertextB64}`;
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt credential');
  }
}

export async function decryptCredential(encrypted) {
  try {
    const key = await getMasterKey();
    const [ivB64, ciphertextB64] = encrypted.split(':');
    
    const iv = Uint8Array.from(atob(ivB64), c => c.charCodeAt(0));
    const ciphertext = Uint8Array.from(atob(ciphertextB64), c => c.charCodeAt(0));
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv, tagLength: 128 },
      key,
      ciphertext
    );
    
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt credential');
  }
}

export async function hashSHA256(data) {
  const encoded = new TextEncoder().encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function computeHMAC(message, secret) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(message)
  );
  
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export default { encryptCredential, decryptCredential, hashSHA256, computeHMAC };