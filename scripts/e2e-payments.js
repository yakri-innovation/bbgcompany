const BASE_URL = process.env.E2E_BASE_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";

const adminCredentials = {
  email: process.env.E2E_ADMIN_EMAIL || process.env.SEED_ADMIN_EMAIL || "admin@bbg-company.fr",
  password: process.env.E2E_ADMIN_PASSWORD || process.env.SEED_ADMIN_PASSWORD || "Admin123!"
};

const clientCredentials = {
  email: process.env.E2E_CLIENT_EMAIL || process.env.SEED_CLIENT_EMAIL || "client@bbg-company.fr",
  password: process.env.E2E_CLIENT_PASSWORD || process.env.SEED_CLIENT_PASSWORD || "Client123!"
};

const paymentLabel = process.env.E2E_PAYMENT_LABEL || `E2E Paiement ${new Date().toISOString().slice(0, 16)}`;
const paymentAmount = process.env.E2E_PAYMENT_AMOUNT || "19.99";
const forcedDossierId = process.env.E2E_DOSSIER_ID || "";

function parseSetCookieHeader(rawHeader) {
  if (!rawHeader) {
    return [];
  }

  return rawHeader
    .split(/,(?=[^;]+=[^;]+)/g)
    .map((value) => value.trim())
    .filter(Boolean);
}

class CookieJar {
  constructor() {
    this.cookies = new Map();
  }

  storeFromResponse(response) {
    const setCookieValues = typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : parseSetCookieHeader(response.headers.get("set-cookie"));

    for (const setCookie of setCookieValues) {
      const firstPart = setCookie.split(";")[0];
      const separatorIndex = firstPart.indexOf("=");

      if (separatorIndex <= 0) {
        continue;
      }

      const name = firstPart.slice(0, separatorIndex).trim();
      const value = firstPart.slice(separatorIndex + 1).trim();

      if (name && value) {
        this.cookies.set(name, value);
      }
    }
  }

  toHeader() {
    return Array.from(this.cookies.entries())
      .map(([name, value]) => `${name}=${value}`)
      .join("; ");
  }
}

async function requestWithCookies(path, { method = "GET", headers = {}, body, jar }) {
  const cookieHeader = jar.toHeader();

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      ...headers
    },
    body,
    redirect: "manual"
  });

  jar.storeFromResponse(response);

  return response;
}

async function getJsonOrThrow(response, fallbackMessage) {
  let payload;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const details = payload?.error || payload?.message || response.statusText;
    throw new Error(`${fallbackMessage} (${response.status}) - ${details}`);
  }

  return payload;
}

async function loginWithCredentials(jar, credentials) {
  const csrfResponse = await requestWithCookies("/api/auth/csrf", { jar });
  const csrfPayload = await getJsonOrThrow(csrfResponse, "Impossible de récupérer le CSRF token");

  const callbackBody = new URLSearchParams({
    csrfToken: csrfPayload.csrfToken,
    email: credentials.email,
    password: credentials.password,
    callbackUrl: `${BASE_URL}/`,
    json: "true"
  });

  const loginResponse = await requestWithCookies("/api/auth/callback/credentials?json=true", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: callbackBody.toString(),
    jar
  });

  if (![200, 302].includes(loginResponse.status)) {
    const text = await loginResponse.text();
    throw new Error(`Échec login ${credentials.email} (${loginResponse.status}) - ${text}`);
  }

  const sessionResponse = await requestWithCookies("/api/auth/session", { jar });
  const sessionPayload = await getJsonOrThrow(sessionResponse, "Impossible de lire la session utilisateur");

  if (!sessionPayload?.user?.email) {
    throw new Error(`Session invalide pour ${credentials.email}`);
  }

  return sessionPayload;
}

async function createPaymentAsAdmin(jar) {
  const listResponse = await requestWithCookies("/api/admin/payments", { jar });
  const listPayload = await getJsonOrThrow(listResponse, "Impossible de charger les dossiers admin");

  const dossier = forcedDossierId
    ? listPayload.dossiers.find((item) => item.id === forcedDossierId)
    : listPayload.dossiers[0];

  if (!dossier) {
    throw new Error("Aucun dossier trouvé pour créer un paiement. Lancez `npm run db:seed:mvp`.");
  }

  const createResponse = await requestWithCookies("/api/admin/payments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      dossierId: dossier.id,
      label: paymentLabel,
      amount: paymentAmount,
      currency: "EUR"
    }),
    jar
  });

  const createPayload = await getJsonOrThrow(createResponse, "Impossible de créer la demande de paiement");

  return {
    payment: createPayload.payment,
    dossier
  };
}

async function createCheckoutAsClient(jar, paymentId) {
  const checkoutResponse = await requestWithCookies("/api/payments/checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ paymentId }),
    jar
  });

  const checkoutPayload = await getJsonOrThrow(checkoutResponse, "Impossible de créer la session checkout");

  if (!checkoutPayload.checkoutUrl || !checkoutPayload.checkoutUrl.includes("checkout.stripe.com")) {
    throw new Error("Checkout URL invalide (Stripe non détecté)");
  }

  return checkoutPayload.checkoutUrl;
}

async function run() {
  console.log("[E2E] Base URL:", BASE_URL);

  const adminJar = new CookieJar();
  const clientJar = new CookieJar();

  const adminSession = await loginWithCredentials(adminJar, adminCredentials);
  console.log("[E2E] Admin connecté:", adminSession.user.email);

  const { payment, dossier } = await createPaymentAsAdmin(adminJar);
  console.log("[E2E] Paiement créé:", payment.id, `(${payment.label})`, "dossier:", dossier.id);

  const clientSession = await loginWithCredentials(clientJar, clientCredentials);
  console.log("[E2E] Client connecté:", clientSession.user.email);

  const checkoutUrl = await createCheckoutAsClient(clientJar, payment.id);
  console.log("[E2E] Checkout URL:", checkoutUrl);

  console.log("[E2E] Succès: création paiement -> checkout opérationnel.");
}

run().catch((error) => {
  console.error("[E2E] Échec:", error.message);
  process.exit(1);
});
