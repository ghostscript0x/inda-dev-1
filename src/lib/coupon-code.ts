// No 0/O or 1/I/L, so codes are easy to read out and type. Works on server and client.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function newCouponCode() {
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(6));
  return `INDA-${Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("")}`;
}
