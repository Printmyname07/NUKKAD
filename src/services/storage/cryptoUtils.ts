/**
 * Utility for hashing credentials using the standard Web Crypto API.
 * Ensures passwords are never stored in plaintext in local storage.
 *
 * NOTE: For a prototype running purely in the browser, client-side hashing
 * is significantly safer than plaintext, but client-side authentication
 * is NOT production-secure without an authoritative backend server.
 */

export async function hashPassword(password: string, salt: string): Promise<string> {
  const text = `${salt}:${password}:aaspass_salt_v1`;
  const encoder = new TextEncoder();
  const data = encoder.encode(text);

  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  // Node.js fallback for test runner environment
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nodeCrypto = await import('crypto');
    return nodeCrypto.createHash('sha256').update(text).digest('hex');
  } catch {
    // Simple numeric digest fallback if crypto is unavailable
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = (hash << 5) - hash + text.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(16, '0');
  }
}

export function generateId(prefix = 'id'): string {
  const randomPart = Math.random().toString(36).substring(2, 10);
  const timePart = Date.now().toString(36);
  return `${prefix}-${timePart}-${randomPart}`;
}
