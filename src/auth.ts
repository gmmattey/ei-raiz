const ITERATIONS = 100_000
const SALT_BYTES = 16
const HASH_BYTES = 32

function toAB(b: Uint8Array): ArrayBuffer {
  return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer
}

function b64enc(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
}

function b64dec(str: string): Uint8Array {
  return Uint8Array.from(atob(str), c => c.charCodeAt(0))
}

const b64url = (s: string) => btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
const b64urlBytes = (b: Uint8Array) => b64enc(b).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
const b64urlDec = (s: string) => atob(s.replace(/-/g, '+').replace(/_/g, '/'))
const b64urlDecBytes = (s: string) => b64dec(s.replace(/-/g, '+').replace(/_/g, '/'))

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: toAB(salt), iterations },
    key,
    HASH_BYTES * 8
  )
  return new Uint8Array(bits)
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES))
  const hash = await derive(password, salt, ITERATIONS)
  return `${ITERATIONS}:${b64enc(salt)}:${b64enc(hash)}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [itStr, saltB64, hashB64] = stored.split(':')
  const iterations = parseInt(itStr, 10)
  if (!iterations || !saltB64 || !hashB64) return false
  const salt = b64dec(saltB64)
  const expected = b64dec(hashB64)
  const actual = await derive(password, salt, iterations)
  if (actual.length !== expected.length) return false
  let diff = 0
  for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i]
  return diff === 0
}

interface TokenPayload {
  sub: number
  email: string
  iat: number
  exp: number
}

export async function signToken(
  userId: number,
  email: string,
  secret: string,
  ttlSeconds = 8 * 60 * 60
): Promise<{ token: string; expiresAt: string }> {
  const iat = Math.floor(Date.now() / 1000)
  const payload: TokenPayload = { sub: userId, email, iat, exp: iat + ttlSeconds }
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = b64url(JSON.stringify(payload))
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(`${header}.${body}`))
  return {
    token: `${header}.${body}.${b64urlBytes(new Uint8Array(sig))}`,
    expiresAt: new Date(payload.exp * 1000).toISOString()
  }
}

export async function verifyToken(token: string, secret: string): Promise<{ userId: number; email: string } | null> {
  const [header, body, sig] = token.split('.')
  if (!header || !body || !sig) return null
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify'])
  const ok = await crypto.subtle.verify('HMAC', key, toAB(b64urlDecBytes(sig)), enc.encode(`${header}.${body}`))
  if (!ok) return null
  const payload = JSON.parse(b64urlDec(body)) as TokenPayload
  const now = Math.floor(Date.now() / 1000)
  if (!payload.sub || !payload.email || payload.exp <= now) return null
  return { userId: payload.sub, email: payload.email }
}
