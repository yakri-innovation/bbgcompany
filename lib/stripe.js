import crypto from "crypto";

const stripeApiBase = "https://api.stripe.com/v1";

function getStripeSecretKey() {
  const key = process.env.STRIPE_SECRET_KEY;

  if (!key) {
    throw new Error("STRIPE_SECRET_KEY_MISSING");
  }

  return key;
}

function getWebhookSecret() {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    throw new Error("STRIPE_WEBHOOK_SECRET_MISSING");
  }

  return secret;
}

function encodeFormBody(payload) {
  const params = new URLSearchParams();

  Object.entries(payload).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      return;
    }

    params.set(key, String(value));
  });

  return params.toString();
}

async function stripeRequest(path, { method = "GET", body, contentType = "application/x-www-form-urlencoded" } = {}) {
  const response = await fetch(`${stripeApiBase}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${getStripeSecretKey()}`,
      ...(body ? { "Content-Type": contentType } : {})
    },
    ...(body ? { body } : {})
  });

  const data = await response.json();

  if (!response.ok) {
    const message = data?.error?.message || `Stripe request failed on ${path}`;
    throw new Error(message);
  }

  return data;
}

export async function createStripeCheckoutSession({
  paymentId,
  label,
  amount,
  currency = "eur",
  customerEmail,
  successUrl,
  cancelUrl
}) {
  const body = encodeFormBody({
    mode: "payment",
    "line_items[0][price_data][currency]": currency.toLowerCase(),
    "line_items[0][price_data][product_data][name]": label,
    "line_items[0][price_data][unit_amount]": amount,
    "line_items[0][quantity]": 1,
    "metadata[paymentId]": paymentId,
    success_url: `${successUrl}${successUrl.includes("?") ? "&" : "?"}paymentId=${paymentId}`,
    cancel_url: `${cancelUrl}${cancelUrl.includes("?") ? "&" : "?"}paymentId=${paymentId}`,
    customer_email: customerEmail || undefined
  });

  return stripeRequest("/checkout/sessions", {
    method: "POST",
    body
  });
}

export async function getStripePaymentIntent(paymentIntentId) {
  return stripeRequest(`/payment_intents/${paymentIntentId}?expand[]=latest_charge`);
}

export function extractReceiptUrlFromPaymentIntent(paymentIntent) {
  const latestCharge = paymentIntent?.latest_charge;

  if (!latestCharge || typeof latestCharge !== "object") {
    return null;
  }

  return typeof latestCharge.receipt_url === "string" ? latestCharge.receipt_url : null;
}

export function verifyStripeWebhookSignature(payload, signatureHeader) {
  const secret = getWebhookSecret();

  if (!signatureHeader) {
    return false;
  }

  const parts = signatureHeader.split(",").reduce((acc, entry) => {
    const [key, value] = entry.split("=");

    if (key && value) {
      acc[key] = value;
    }

    return acc;
  }, {});

  if (!parts.t || !parts.v1) {
    return false;
  }

  const signedPayload = `${parts.t}.${payload}`;
  const expected = crypto.createHmac("sha256", secret).update(signedPayload).digest("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1));
  } catch {
    return false;
  }
}
