import "server-only";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const randomToken = (bytes = 32) => randomBytes(bytes).toString("base64url");
export const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

export function hmacHex(algorithm: "sha256" | "sha512", key: string, payload: string | Buffer) {
  return createHmac(algorithm, key).update(payload).digest("hex");
}

/** Constant-time comparison of two hex/base64 strings. */
export function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}
