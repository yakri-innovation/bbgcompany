import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";
import { createStripeCheckoutSession } from "@/lib/stripe";

const payableStatuses = ["REQUESTED", "PENDING"];

function getAppUrl() {
  return process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
}

async function createCheckoutForSession(session, paymentId) {
  if (!paymentId) {
    return { ok: false, status: 400, error: "Paiement invalide." };
  }

  if (!session?.user?.id) {
    return { ok: false, status: 401, error: "Connexion requise." };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      clientProfile: {
        select: {
          id: true
        }
      }
    }
  });

  if (!user?.clientProfile?.id) {
    return { ok: false, status: 403, error: "Profil client introuvable." };
  }

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      dossier: {
        select: {
          id: true,
          title: true
        }
      },
      client: {
        select: {
          id: true,
          user: {
            select: {
              email: true
            }
          }
        }
      }
    }
  });

  if (!payment || payment.clientId !== user.clientProfile.id) {
    return { ok: false, status: 404, error: "Paiement introuvable." };
  }

  if (!payableStatuses.includes(payment.status)) {
    return { ok: false, status: 400, error: "Ce paiement ne peut pas être réglé actuellement." };
  }

  const appUrl = getAppUrl();

  try {
    const checkoutSession = await createStripeCheckoutSession({
      paymentId: payment.id,
      label: payment.label,
      amount: payment.amount,
      currency: payment.currency,
      customerEmail: payment.client.user.email,
      successUrl: `${appUrl}/espace-client?paymentStatus=success`,
      cancelUrl: `${appUrl}/espace-client?paymentStatus=cancel`
    });

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "PENDING",
        provider: "stripe",
        providerSessionId: checkoutSession.id
      }
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        entityType: "Payment",
        entityId: payment.id,
        action: "CHECKOUT_SESSION_CREATED",
        metadata: {
          provider: "stripe",
          providerSessionId: checkoutSession.id,
          dossierId: payment.dossier.id
        }
      }
    });

    return {
      ok: true,
      checkoutUrl: checkoutSession.url
    };
  } catch (error) {
    const code = error.message === "STRIPE_SECRET_KEY_MISSING" ? 500 : 400;
    const fallbackMessage = error.message === "STRIPE_SECRET_KEY_MISSING"
      ? "Configuration Stripe manquante sur le serveur."
      : "Impossible d'initialiser la session de paiement.";

    return { ok: false, status: code, error: fallbackMessage };
  }
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  const body = await request.json();
  const paymentId = typeof body.paymentId === "string" ? body.paymentId.trim() : "";
  const result = await createCheckoutForSession(session, paymentId);

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: result.status });
  }

  return Response.json({ checkoutUrl: result.checkoutUrl });
}

export async function GET(request) {
  const session = await getServerSession(authOptions);
  const paymentId = request.nextUrl.searchParams.get("paymentId")?.trim() || "";
  const result = await createCheckoutForSession(session, paymentId);

  if (!result.ok) {
    if (result.status === 401) {
      const callbackUrl = encodeURIComponent(`/espace-client?paymentError=${result.status}`);
      return NextResponse.redirect(new URL(`/connexion?callbackUrl=${callbackUrl}`, request.url));
    }

    return NextResponse.redirect(new URL(`/espace-client?paymentError=${result.status}`, request.url));
  }

  return NextResponse.redirect(result.checkoutUrl);
}
