/**
 * Simple XOR-based obfuscation for API keys
 *
 * NOTE: This is NOT cryptographically secure encryption.
 * It's obfuscation to prevent casual viewing in localStorage.
 * For production apps with sensitive data, use Web Crypto API
 * or a backend proxy to handle API keys.
 */

// Generate a deterministic key from a seed phrase
function generateKey(seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// XOR encryption/decryption (symmetric)
function xorCipher(text, key) {
  let result = '';
  const keyStr = key.toString();

  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    const keyChar = keyStr.charCodeAt(i % keyStr.length);
    result += String.fromCharCode(charCode ^ keyChar);
  }

  return result;
}

/**
 * Obfuscate a string (typically an API key)
 * @param {string} plaintext - The text to obfuscate
 * @returns {string} - Base64 encoded obfuscated text
 */
export function obfuscate(plaintext) {
  if (!plaintext) return '';

  // Use a seed that's unique per domain but consistent
  const seed = `meal-planner-${window.location.hostname}`;
  const key = generateKey(seed);

  // XOR cipher the text
  const obfuscated = xorCipher(plaintext, key);

  // Encode to base64 to make it storage-safe
  return btoa(obfuscated);
}

/**
 * Deobfuscate a string (typically an API key)
 * @param {string} obfuscatedText - The base64 encoded obfuscated text
 * @returns {string} - The original plaintext
 */
export function deobfuscate(obfuscatedText) {
  if (!obfuscatedText) return '';

  try {
    // Decode from base64
    const decoded = atob(obfuscatedText);

    // Use the same seed to generate the key
    const seed = `meal-planner-${window.location.hostname}`;
    const key = generateKey(seed);

    // XOR cipher again (symmetric operation)
    return xorCipher(decoded, key);
  } catch (error) {
    console.error('Failed to deobfuscate:', error);
    return '';
  }
}

/**
 * Check if a string appears to be obfuscated
 * @param {string} text - The text to check
 * @returns {boolean} - True if the text looks obfuscated
 */
export function isObfuscated(text) {
  if (!text) return false;

  // Check if it's base64 encoded (no API keys start with base64-like patterns)
  // API keys typically start with 'sk-ant-' for Anthropic
  return !text.startsWith('sk-') && /^[A-Za-z0-9+/]+=*$/.test(text);
}
