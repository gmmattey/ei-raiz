import { ErroAutenticacao } from "./erros";

const ITERACOES = 120_000;
const SALT_BYTES = 16;
const HASH_BYTES = 32;
const ITERACOES_FALLBACK = 20_000;

function base64Encode(bytes: Uint8Array): string {
  const maybeBtoa = (globalThis as { btoa?: (value: string) => string }).btoa;
  if (typeof maybeBtoa === "function") {
    return maybeBtoa(String.fromCharCode(...bytes));
  }

  const maybeBuffer = (globalThis as { Buffer?: { from(input: Uint8Array): { toString(enc: string): string } } }).Buffer;
  if (maybeBuffer) {
    return maybeBuffer.from(bytes).toString("base64");
  }

  throw new Error("BASE64_ENCODE_UNAVAILABLE");
}

function base64Decode(value: string): Uint8Array {
  const maybeAtob = (globalThis as { atob?: (value: string) => string }).atob;
  if (typeof maybeAtob === "function") {
    return Uint8Array.from(maybeAtob(value), (char) => char.charCodeAt(0));
  }

  const maybeBuffer = (globalThis as { Buffer?: { from(input: string, encoding: string): Uint8Array } }).Buffer;
  if (maybeBuffer) {
    return new Uint8Array(maybeBuffer.from(value, "base64"));
  }

  throw new Error("BASE64_DECODE_UNAVAILABLE");
}

async function derivarHash(senha: string, salt: Uint8Array, iteracoes: number): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  try {
    const key = await crypto.subtle.importKey("raw", encoder.encode(senha), "PBKDF2", false, ["deriveBits"]);
    const saltBuffer = salt.buffer.slice(salt.byteOffset, salt.byteOffset + salt.byteLength) as ArrayBuffer;
    const bits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        hash: "SHA-256",
        salt: saltBuffer,
        iterations: iteracoes,
      },
      key,
      HASH_BYTES * 8,
    );
    return new Uint8Array(bits);
  } catch {
    const efetivo = Math.max(1, Math.min(iteracoes, ITERACOES_FALLBACK));
    let atual = new Uint8Array([...salt, ...encoder.encode(senha)]);
    for (let i = 0; i < efetivo; i += 1) {
      const digest = await crypto.subtle.digest("SHA-256", atual);
      atual = new Uint8Array([...new Uint8Array(digest), ...salt]);
    }
    return atual.slice(0, HASH_BYTES);
  }
}

export async function gerarHashSenha(senha: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await derivarHash(senha, salt, ITERACOES);
  return `${ITERACOES}:${base64Encode(salt)}:${base64Encode(hash)}`;
}

export async function validarSenha(senha: string, senhaHash: string): Promise<boolean> {
  const [iteracoesBrutas, saltBruto, hashBruto] = senhaHash.split(":");
  const iteracoes = Number.parseInt(iteracoesBrutas, 10);
  if (!iteracoes || !saltBruto || !hashBruto) {
    throw new ErroAutenticacao("HASH_INVALIDO", 500, "Formato do hash inválido");
  }

  const salt = base64Decode(saltBruto);
  const hashEsperado = base64Decode(hashBruto);
  const hashAtual = await derivarHash(senha, salt, iteracoes);

  if (hashAtual.length !== hashEsperado.length) return false;
  let diff = 0;
  for (let i = 0; i < hashAtual.length; i += 1) {
    diff |= hashAtual[i] ^ hashEsperado[i];
  }
  return diff === 0;
}
