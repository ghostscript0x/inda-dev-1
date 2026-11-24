import "server-only";
import { env, requireSecret } from "./env";
import { hmacHex, safeEqual } from "./crypto";

const API = "https://api.paystack.co";

type PaystackResponse<T> = { status: boolean; message: string; data: T };

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const key = requireSecret("PAYSTACK_SECRET_KEY", env.paystackSecret);
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${key}`, "content-type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  const json = (await res.json().catch(() => null)) as PaystackResponse<T> | null;
  if (!res.ok || !json?.status) throw new Error(`Paystack ${path} failed: ${json?.message ?? `HTTP ${res.status}`}`);
  return json.data;
}

export function initializeTransaction(input: { email: string; amount: number; reference: string; callbackUrl: string; metadata: Record<string, unknown> }) {
  return call<{ authorization_url: string; access_code: string; reference: string }>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      amount: input.amount,
      currency: "NGN",
      reference: input.reference,
      callback_url: input.callbackUrl,
      metadata: input.metadata,
    }),
  });
}

export type PaystackTransaction = { id: number; status: string; reference: string; amount: number; currency: string; paid_at: string | null; customer: { email: string } };

export function verifyTransaction(reference: string) {
  return call<PaystackTransaction>(`/transaction/verify/${encodeURIComponent(reference)}`);
}

/** Paystack signs the raw body with HMAC-SHA512 using the secret key. */
export function verifyWebhookSignature(rawBody: string, signature: string | null) {
  if (!signature) return false;
  const expected = hmacHex("sha512", requireSecret("PAYSTACK_SECRET_KEY", env.paystackSecret), rawBody);
  return safeEqual(expected, signature);
}
