const textEncoder = new TextEncoder();

const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
// Cloudflare Workers' WebCrypto PBKDF2 has a practical upper bound for iterations.
// Acima disso, o runtime pode falhar com NotSupportedError.
// Balanceado para MVP: reduz latencia percebida no login/registro sem trocar o algoritmo.
const PASSWORD_ITERATIONS = 60000;
const PASSWORD_ITERATIONS_MAX_SUPPORTED = 100000;
const PASSWORD_KEY_LENGTH_BITS = 256;

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const derived = await derivePasswordBits(password, salt, PASSWORD_ITERATIONS);
  return [
    'pbkdf2_sha256',
    String(PASSWORD_ITERATIONS),
    toBase64Url(salt),
    toBase64Url(new Uint8Array(derived))
  ].join('$');
}

export async function verifyPassword(storedHash: string, password: string): Promise<boolean> {
  const parts = storedHash.split('$');
  if (parts.length !== 4) return false;
  const [algorithm, iterationValue, saltValue, hashValue] = parts;
  if (algorithm !== 'pbkdf2_sha256') return false;

  const iterations = Number(iterationValue || 0);
  if (!iterations) return false;
  if (iterations > PASSWORD_ITERATIONS_MAX_SUPPORTED) return false;

  const salt = fromBase64Url(saltValue);
  const expected = fromBase64Url(hashValue);
  const derived = new Uint8Array(await derivePasswordBits(password, salt, iterations));

  return timingSafeEqual(derived, expected);
}

export function generateOpaqueToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return toBase64Url(bytes);
}

export async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', textEncoder.encode(token));
  return toHex(new Uint8Array(digest));
}

export function buildEntityId(prefix: string): string {
  return `${prefix}_${generateUlid()}`;
}

function generateUlid(): string {
  const time = Date.now();
  const random = crypto.getRandomValues(new Uint8Array(10));
  return encodeTime(time, 10) + encodeRandom(random);
}

async function derivePasswordBits(password: string, salt: Uint8Array, iterations: number): Promise<ArrayBuffer> {
  const baseKey = await crypto.subtle.importKey('raw', textEncoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  return await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, baseKey, PASSWORD_KEY_LENGTH_BITS);
}

function encodeTime(time: number, length: number): string {
  let value = time;
  let output = '';
  for (let index = length - 1; index >= 0; index -= 1) {
    output = CROCKFORD[value % 32] + output;
    value = Math.floor(value / 32);
  }
  return output;
}

function encodeRandom(bytes: Uint8Array): string {
  let value = 0n;
  for (const byte of bytes) {
    value = (value << 8n) | BigInt(byte);
  }
  let output = '';
  for (let index = 0; index < 16; index += 1) {
    output = CROCKFORD[Number(value & 31n)] + output;
    value >>= 5n;
  }
  return output;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(value: string): Uint8Array {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function timingSafeEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let index = 0; index < left.length; index += 1) {
    diff |= left[index] ^ right[index];
  }
  return diff === 0;
}
