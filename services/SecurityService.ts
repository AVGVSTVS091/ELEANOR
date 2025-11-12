
/**
 * SecurityService
 * 
 * Handles encryption/decryption, key management, and PIN validation.
 * Uses standard Web Crypto API (AES-GCM) for encryption.
 */
export const SecurityService = {
  /**
   * Generates a symmetric key for AES-GCM encryption.
   * This key should be stored in secure storage (IndexedDB for web).
   */
  async generateKey(): Promise<CryptoKey> {
    return window.crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256,
      },
      true,
      ["encrypt", "decrypt"]
    );
  },

  /**
   * Encrypts data using AES-GCM.
   * Returns an object containing the IV and the encrypted buffer.
   */
  async encryptData(data: string, key: CryptoKey): Promise<{ iv: Uint8Array; cipherText: ArrayBuffer }> {
    const encodedData = new TextEncoder().encode(data);
    const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM

    const cipherText = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      encodedData
    );

    return { iv, cipherText };
  },

  /**
   * Decrypts data using AES-GCM.
   */
  async decryptData(cipherText: ArrayBuffer, iv: Uint8Array, key: CryptoKey): Promise<string> {
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      cipherText
    );

    return new TextDecoder().decode(decryptedBuffer);
  },

  /**
   * Generates a secure 6-digit PIN.
   */
  generatePin(): string {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    // Simple generation logic, in production this might involve more complex entropy usage
    const pin = (array[0] % 1000000).toString().padStart(6, '0');
    return pin;
  },

  /**
   * Validates a PIN hash (simulated server-side validation stub).
   */
  async validatePin(inputPin: string, storedHash: string, salt: string): Promise<boolean> {
    // Stub for validating a hashed PIN against input
    // In a real scenario, this uses PBKDF2 or Argon2
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      "raw",
      enc.encode(inputPin),
      { name: "PBKDF2" },
      false,
      ["deriveBits", "deriveKey"]
    );
    
    // This is a placeholder implementation for the architecture
    return true; 
  }
};
