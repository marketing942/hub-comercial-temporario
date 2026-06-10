import { cookies } from "next/headers";

export type Role = "admin" | "seller";
export type Session = { role: Role; sellerId?: string };

const COOKIE = "hub_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 dias

function secret() {
  return process.env.SESSION_SECRET || "dev-secret-change-me";
}

function b64urlEncode(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let str = "";
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function b64urlEncodeStr(s: string): string {
  return b64urlEncode(new TextEncoder().encode(s));
}

function b64urlDecodeStr(s: string): string {
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  const b64 = (s + pad).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

async function hmac(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return b64urlEncode(sig);
}

export async function encodeSession(s: Session): Promise<string> {
  const body = b64urlEncodeStr(JSON.stringify(s));
  const sig = await hmac(body);
  return `${body}.${sig}`;
}

export async function decodeSession(token?: string | null): Promise<Session | null> {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = await hmac(body);
  if (expected !== sig) return null;
  try {
    return JSON.parse(b64urlDecodeStr(body)) as Session;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<Session | null> {
  const c = cookies().get(COOKIE)?.value;
  return decodeSession(c);
}

export async function sessionCookie(s: Session) {
  return {
    name: COOKIE,
    value: await encodeSession(s),
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  };
}

export function clearCookie() {
  return {
    name: COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  };
}
