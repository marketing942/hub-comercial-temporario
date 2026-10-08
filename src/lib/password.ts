// Hash/verificacao de senhas via PBKDF2 (Web Crypto). Funciona em Node e
// Edge runtime. Formato armazenado: `pbkdf2$<iter>$<saltB64>$<hashB64>`.
//
// Nao e tao forte quanto argon2/bcrypt, mas e substancialmente melhor
// que SHA-256 cru e evita adicionar dependencias nativas. Senha dos
// vendedores e usada so pra login no proprio sistema, nao e portavel.

const ITER = 120_000;
const KEYLEN = 32; // 256 bits
const SALT_LEN = 16;

function b64enc(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

function b64dec(s: string): Uint8Array {
  const bin = atob(s);
  const u = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  return u;
}

async function derive(password: string, salt: Uint8Array, iter: number): Promise<Uint8Array> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt as unknown as ArrayBuffer, iterations: iter, hash: "SHA-256" },
    keyMaterial,
    KEYLEN * 8
  );
  return new Uint8Array(bits);
}

export async function hashPassword(plain: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LEN));
  const hash = await derive(plain, salt, ITER);
  return `pbkdf2$${ITER}$${b64enc(salt)}$${b64enc(hash)}`;
}

// Comparacao em tempo constante.
function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function verifyPassword(plain: string, encoded: string | null | undefined): Promise<boolean> {
  if (!encoded) return false;
  const parts = encoded.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;
  const iter = Number(parts[1]);
  if (!Number.isFinite(iter) || iter < 1_000 || iter > 10_000_000) return false;
  let salt: Uint8Array;
  let expected: Uint8Array;
  try {
    salt = b64dec(parts[2]);
    expected = b64dec(parts[3]);
  } catch {
    return false;
  }
  const got = await derive(plain, salt, iter);
  return constantTimeEqual(got, expected);
}

// Regras simples pra senha: ao menos 4 caracteres, sem whitespace nas
// pontas (igual trim). Nao impoe complexidade — admin ja define a
// politica externa.
export function sanitizePassword(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const s = input.trim();
  if (s.length < 4 || s.length > 200) return null;
  return s;
}
