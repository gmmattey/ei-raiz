import { ErroAutenticacao } from "./erros";

type PayloadJWT = {
  sub: string;
  email: string;
  iat: number;
  exp: number;
};

const encoder = new TextEncoder();

const encodeBase64 = (value: string): string => {
  const maybeBtoa = (globalThis as { btoa?: (input: string) => string }).btoa;
  if (typeof maybeBtoa === "function") {
    return maybeBtoa(value);
  }
  const maybeBuffer = (globalThis as { Buffer?: { from(input: string, encoding: string): { toString(enc: string): string } } }).Buffer;
  if (maybeBuffer) {
    return maybeBuffer.from(value, "binary").toString("base64");
  }
  throw new Error("BASE64_ENCODE_UNAVAILABLE");
};

const decodeBase64 = (value: string): string => {
  const maybeAtob = (globalThis as { atob?: (input: string) => string }).atob;
  if (typeof maybeAtob === "function") {
    return maybeAtob(value);
  }
  const maybeBuffer = (globalThis as { Buffer?: { from(input: string, encoding: string): { toString(enc: string): string } } }).Buffer;
  if (maybeBuffer) {
    return maybeBuffer.from(value, "base64").toString("binary");
  }
  throw new Error("BASE64_DECODE_UNAVAILABLE");
};

const base64UrlEncode = (value: string): string =>
  encodeBase64(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");

const base64UrlEncodeBytes = (bytes: Uint8Array): string =>
  encodeBase64(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");

const base64UrlDecode = (value: string): string => decodeBase64(value.replace(/-/g, "+").replace(/_/g, "/"));

const base64UrlDecodeBytes = (value: string): Uint8Array =>
  Uint8Array.from(decodeBase64(value.replace(/-/g, "+").replace(/_/g, "/")), (char) => char.charCodeAt(0));

const toArrayBuffer = (bytes: Uint8Array): ArrayBuffer =>
  bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;

async function gerarAssinatura(dados: string, segredo: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(segredo), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(dados));
  return base64UrlEncodeBytes(new Uint8Array(signature));
}

async function validarAssinatura(dados: string, assinatura: string, segredo: string): Promise<boolean> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(segredo), { name: "HMAC", hash: "SHA-256" }, false, [
    "verify",
  ]);
  return crypto.subtle.verify("HMAC", key, toArrayBuffer(base64UrlDecodeBytes(assinatura)), encoder.encode(dados));
}

export async function emitirTokenAcesso(
  dados: { usuarioId: string; email: string },
  segredo: string,
  validadeSegundos = 60 * 60 * 8,
): Promise<{ token: string; expiraEm: string }> {
  const iat = Math.floor(Date.now() / 1000);
  const payload: PayloadJWT = {
    sub: dados.usuarioId,
    email: dados.email,
    iat,
    exp: iat + validadeSegundos,
  };

  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64UrlEncode(JSON.stringify(payload));
  const assinatura = await gerarAssinatura(`${header}.${body}`, segredo);
  return {
    token: `${header}.${body}.${assinatura}`,
    expiraEm: new Date(payload.exp * 1000).toISOString(),
  };
}

export async function validarTokenAcesso(token: string, segredo: string): Promise<{ usuarioId: string; email: string }> {
  const [header, body, assinatura] = token.split(".");
  if (!header || !body || !assinatura) {
    throw new ErroAutenticacao("TOKEN_INVALIDO", 401, "Token inválido");
  }

  const assinaturaValida = await validarAssinatura(`${header}.${body}`, assinatura, segredo);
  if (!assinaturaValida) {
    throw new ErroAutenticacao("TOKEN_INVALIDO", 401, "Token inválido");
  }

  const payload = JSON.parse(base64UrlDecode(body)) as PayloadJWT;
  const agora = Math.floor(Date.now() / 1000);
  if (!payload.sub || !payload.email || !payload.exp || payload.exp <= agora) {
    throw new ErroAutenticacao("TOKEN_EXPIRADO", 401, "Token expirado");
  }

  return { usuarioId: payload.sub, email: payload.email };
}
