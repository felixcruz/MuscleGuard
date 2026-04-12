// Admin authentication utilities — password hashing, session tokens, TOTP

export const SESSION_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours

// ---------- Password hashing (PBKDF2 via Web Crypto) ----------

function hexEncode(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexDecode(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const derived = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt.buffer as ArrayBuffer,
      iterations: 100_000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );
  // Store as saltHex + ":" + derivedHex
  return hexEncode(salt.buffer as ArrayBuffer) + ":" + hexEncode(derived);
}

export async function verifyPassword(
  password: string,
  stored: string
): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;

  const salt = hexDecode(saltHex);
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const derived = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt.buffer as ArrayBuffer,
      iterations: 100_000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );
  return hexEncode(derived) === hashHex;
}

// ---------- Session tokens ----------

export function generateSessionToken(): string {
  return crypto.randomUUID();
}

export function hashToken(token: string): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createHash } = require("crypto");
  return createHash("sha256").update(token).digest("hex");
}

// ---------- TOTP (RFC 6238) ----------

const BASE32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Encode(buffer: Uint8Array): string {
  let bits = "";
  for (let i = 0; i < buffer.length; i++) {
    bits += buffer[i].toString(2).padStart(8, "0");
  }
  let result = "";
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.substring(i, i + 5).padEnd(5, "0");
    result += BASE32_CHARS[parseInt(chunk, 2)];
  }
  return result;
}

function base32Decode(encoded: string): Uint8Array {
  let bits = "";
  const upper = encoded.toUpperCase();
  for (let i = 0; i < upper.length; i++) {
    const idx = BASE32_CHARS.indexOf(upper[i]);
    if (idx === -1) continue;
    bits += idx.toString(2).padStart(5, "0");
  }
  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bits.substring(i * 8, i * 8 + 8), 2);
  }
  return bytes;
}

export function generateTOTPSecret(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(20));
  return base32Encode(bytes);
}

function hmacSha1(key: Uint8Array, message: Uint8Array): Uint8Array {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createHmac } = require("crypto");
  const hmac = createHmac("sha1", Buffer.from(key));
  hmac.update(Buffer.from(message));
  return new Uint8Array(hmac.digest());
}

function generateHOTP(secret: Uint8Array, counter: number): string {
  // Convert counter to 8-byte big-endian
  const counterBytes = new Uint8Array(8);
  let c = counter;
  for (let i = 7; i >= 0; i--) {
    counterBytes[i] = c & 0xff;
    c = Math.floor(c / 256);
  }

  const hmacResult = hmacSha1(secret, counterBytes);

  // Dynamic truncation
  const offset = hmacResult[hmacResult.length - 1] & 0x0f;
  const code =
    ((hmacResult[offset] & 0x7f) << 24) |
    ((hmacResult[offset + 1] & 0xff) << 16) |
    ((hmacResult[offset + 2] & 0xff) << 8) |
    (hmacResult[offset + 3] & 0xff);

  return (code % 1_000_000).toString().padStart(6, "0");
}

export function verifyTOTP(secret: string, code: string): boolean {
  const secretBytes = base32Decode(secret);
  const now = Math.floor(Date.now() / 1000);
  const timeStep = 30;

  // Check current step and +/- 1 step for clock drift tolerance
  for (let offset = -1; offset <= 1; offset++) {
    const counter = Math.floor(now / timeStep) + offset;
    const expected = generateHOTP(secretBytes, counter);
    if (expected === code) return true;
  }
  return false;
}
