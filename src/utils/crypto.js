/**
 * Aegis Secure Cryptography Module
 * Implements hardware-accelerated AES-GCM 256-bit encryption
 * with PBKDF2 key derivation from a user's master PIN.
 */

// Helper to convert ArrayBuffer to Base64
export function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Helper to convert Base64 to ArrayBuffer
export function base64ToArrayBuffer(base64) {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Helper to derive a cryptographically secure key from a PIN using PBKDF2
async function deriveKey(pin, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(pin),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts an ArrayBuffer file with a derived PIN key.
 * Returns an object containing the Base64 ciphertext, Base64 IV, and Base64 salt.
 */
export async function encryptFile(arrayBuffer, pin) {
  try {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV standard for AES-GCM
    const key = await deriveKey(pin, salt);

    const ciphertextBuffer = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      arrayBuffer
    );

    return {
      ciphertext: arrayBufferToBase64(ciphertextBuffer),
      iv: arrayBufferToBase64(iv),
      salt: arrayBufferToBase64(salt)
    };
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Encryption failed. Please ensure the PIN is valid.');
  }
}

/**
 * Decrypts a Base64 ciphertext using the PIN, IV, and salt.
 * Returns the decrypted ArrayBuffer.
 */
export async function decryptFile(ciphertextBase64, pin, ivBase64, saltBase64) {
  try {
    const ciphertext = base64ToArrayBuffer(ciphertextBase64);
    const iv = new Uint8Array(base64ToArrayBuffer(ivBase64));
    const salt = new Uint8Array(base64ToArrayBuffer(saltBase64));
    
    const key = await deriveKey(pin, salt);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      ciphertext
    );

    return decryptedBuffer;
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Incorrect Security PIN or corrupted data.');
  }
}

/**
 * Generates a PBKDF2 hash of a PIN to securely verify the PIN on subsequent entries
 * without storing the PIN in plaintext.
 */
export async function hashPIN(pin, existingSalt = null) {
  const enc = new TextEncoder();
  const salt = existingSalt ? new Uint8Array(base64ToArrayBuffer(existingSalt)) : window.crypto.getRandomValues(new Uint8Array(16));
  
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(pin),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await window.crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 50000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );

  return {
    hash: arrayBufferToBase64(derivedBits),
    salt: arrayBufferToBase64(salt)
  };
}
