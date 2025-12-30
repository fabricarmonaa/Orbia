import crypto from 'node:crypto';

const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

export function generateId(length = 26) {
  let id = '';
  const bytes = crypto.randomBytes(length * 2);
  for (let i = 0; i < bytes.length && id.length < length; i++) {
    id += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return id;
}
