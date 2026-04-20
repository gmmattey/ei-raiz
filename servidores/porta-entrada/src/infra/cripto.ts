// Primitivas criptográficas para hash de senha e JWT HS256.
// Reaproveita algoritmo PBKDF2 e HMAC que já rodavam em modulos-backend/autenticacao.

const ITERACOES = 120_000;
const SALT_BYTES = 16;
const HASH_BYTES = 32;
const ITERACOES_FALLBACK = 20_000;

function b64encBytes(bytes: Uint8Array): string {
  const btoa = (globalThis as { btoa?: (v: string) => string }).btoa;
  if (btoa) return btoa(String.fromCharCode(...bytes));
  const Buf = (globalThis as { Buffer?: { from(b: Uint8Array): { toString(e: string): string } } }).Buffer;
  if (Buf) return Buf.from(bytes).toString('base64');
  throw new Error('BASE64_ENCODE_UNAVAILABLE');
}

function b64decBytes(v: string): Uint8Array {
  const atob = (globalThis as { atob?: (v: string) => string }).atob;
  if (atob) return Uint8Array.from(atob(v), (c) => c.charCodeAt(0));
  const Buf = (globalThis as { Buffer?: { from(i: string, e: string): Uint8Array } }).Buffer;
  if (Buf) return new Uint8Array(Buf.from(v, 'base64'));
  throw new Error('BASE64_DECODE_UNAVAILABLE');
}

function b64encStr(v: string): string {
  const btoa = (globalThis as { btoa?: (v: string) => string }).btoa;
  if (btoa) return btoa(v);
  const Buf = (globalThis as { Buffer?: { from(i: string, e: string): { toString(e: string): string } } }).Buffer;
  if (Buf) return Buf.from(v, 'binary').toString('base64');
  throw new Error('BASE64_ENCODE_UNAVAILABLE');
}

function b64decStr(v: string): string {
  const atob = (globalThis as { atob?: (v: string) => string }).atob;
  if (atob) return atob(v);
  const Buf = (globalThis as { Buffer?: { from(i: string, e: string): { toString(e: string): string } } }).Buffer;
  if (Buf) return Buf.from(v, 'base64').toString('binary');
  throw new Error('BASE64_DECODE_UNAVAILABLE');
}

const b64url = (v: string) => b64encStr(v).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
const b64urlBytes = (b: Uint8Array) => b64encBytes(b).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
const b64urlDec = (v: string) => b64decStr(v.replace(/-/g, '+').replace(/_/g, '/'));
const b64urlDecBytes = (v: string) => b64decBytes(v.replace(/-/g, '+').replace(/_/g, '/'));

const toAB = (b: Uint8Array): ArrayBuffer => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;

async function derivar(senha: string, salt: Uint8Array, iteracoes: number): Promise<Uint8Array> {
  const enc = new TextEncoder();
  try {
    const key = await crypto.subtle.importKey('raw', enc.encode(senha), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', hash: 'SHA-256', salt: toAB(salt), iterations: iteracoes },
      key,
      HASH_BYTES * 8,
    );
    return new Uint8Array(bits);
  } catch {
    const ef = Math.max(1, Math.min(iteracoes, ITERACOES_FALLBACK));
    let atual = new Uint8Array([...salt, ...enc.encode(senha)]);
    for (let i = 0; i < ef; i += 1) {
      const d = await crypto.subtle.digest('SHA-256', atual);
      atual = new Uint8Array([...new Uint8Array(d), ...salt]);
    }
    return atual.slice(0, HASH_BYTES);
  }
}

export async function gerarHashSenha(senha: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await derivar(senha, salt, ITERACOES);
  return `${ITERACOES}:${b64encBytes(salt)}:${b64encBytes(hash)}`;
}

export async function validarSenha(senha: string, hash: string): Promise<boolean> {
  const [it, sB, hB] = hash.split(':');
  const iteracoes = Number.parseInt(it, 10);
  if (!iteracoes || !sB || !hB) return false;
  const salt = b64decBytes(sB);
  const esperado = b64decBytes(hB);
  const atual = await derivar(senha, salt, iteracoes);
  if (atual.length !== esperado.length) return false;
  let diff = 0;
  for (let i = 0; i < atual.length; i += 1) diff |= atual[i] ^ esperado[i];
  return diff === 0;
}

export interface PayloadSessaoToken {
  sub: string;
  email: string;
  iat: number;
  exp: number;
}

export async function emitirToken(
  dados: { usuarioId: string; email: string },
  segredo: string,
  validadeSegundos = 60 * 60 * 8,
): Promise<{ token: string; expiraEm: string }> {
  const iat = Math.floor(Date.now() / 1000);
  const payload: PayloadSessaoToken = { sub: dados.usuarioId, email: dados.email, iat, exp: iat + validadeSegundos };
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = b64url(JSON.stringify(payload));
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(segredo), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(`${header}.${body}`));
  return {
    token: `${header}.${body}.${b64urlBytes(new Uint8Array(sig))}`,
    expiraEm: new Date(payload.exp * 1000).toISOString(),
  };
}

export async function validarToken(token: string, segredo: string): Promise<{ usuarioId: string; email: string } | null> {
  const [header, body, sig] = token.split('.');
  if (!header || !body || !sig) return null;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(segredo), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  const ok = await crypto.subtle.verify('HMAC', key, toAB(b64urlDecBytes(sig)), enc.encode(`${header}.${body}`));
  if (!ok) return null;
  const payload = JSON.parse(b64urlDec(body)) as PayloadSessaoToken;
  const agora = Math.floor(Date.now() / 1000);
  if (!payload.sub || !payload.email || payload.exp <= agora) return null;
  return { usuarioId: payload.sub, email: payload.email };
}

export const gerarPin = (): string => {
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000;
  return n.toString().padStart(6, '0');
};
