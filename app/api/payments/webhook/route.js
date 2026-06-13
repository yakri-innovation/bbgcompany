import { prisma } from "@/lib/prisma";
import { extractReceiptUrlFromPaymentIntent, getStripePaymentIntent, verifyStripeWebhookSignature } from "@/lib/stripe";
import { createAdminNotifications, createUserNotification } from "@/lib/notifications";

export async function POST(request) {
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");

  let isValid = false;

  try {
    isValid = verifyStripeWebhookSignature(payload, signature);
  } catch (error) {
    if (error.message === "STRIPE_WEBHOOK_SECRET_MISSING") {
      return Response.json({ error: "Configuration webhook Stripe manquante." }, { status: 500 });
    }

    return Response.json({ error: "Signature invalide." }, { status: 400 });
  }

  if (!isValid) {
    return Response.json({ error: "Signature invalide." }, { status: 400 });
  }

  let event;

  try {
    event = JSON.parse(payload);
  } catch {
    return Response.json({ error: "Payload invalide." }, { status: 400 });
  }

  const eventType = event?.type;
  const object = event?.data?.object;

  if (!eventType || !object) {
    return Response.json({ received: true });
  }

  const paymentId = object?.metadata?.paymentId;

  if (!paymentId) {
    return Response.json({ received: true });
  }

  if (eventType === "checkout.session.completed") {
    let invoiceUrl = null;

    if (typeof object.payment_intent === "string") {
      try {
        const paymentIntent = await getStripePaymentIntent(object.payment_intent);
        invoiceUrl = extractReceiptUrlFromPaymentIntent(paymentIntent);
      } catch (error) {
        console.error("Unable to fetch Stripe receipt URL", error);
      }
    }

    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: "PAID",
        paidAt: new Date(),
        provider: "stripe",
        providerSessionId: object.id || null,
        providerPaymentId: typeof object.payment_intent === "string" ? object.payment_intent : null,
        invoiceUrl: invoiceUrl || undefined
      },
      include: {
        dossier: {
          select: {
            id: true,
            title: true
          }
        },
        client: {
          select: {
            userId: true,
            user: {
              select: {
                email: true
              }
            }
          }
        }
      }
    });

    await prisma.auditLog.create({
      data: {
        entityType: "Payment",
        entityId: paymentId,
        action: "WEBHOOK_PAID",
        metadata: {
          eventType,
          providerSessionId: object.id || null,
          providerPaymentId: typeof object.payment_intent === "string" ? object.payment_intent : null,
          invoiceUrl: invoiceUrl || null
        }
      }
    });

    await createUserNotification({
      userId: updatedPayment.client.userId,
      recipientEmail: updatedPayment.client.user.email,
      dossierId: updatedPayment.dossier.id,
      type: "PAYMENT_PAID",
      title: "Paiement confirmé",
      message: `Votre paiement "${updatedPayment.label}" a été confirmé.`,
      preferEmail: true
    });

    await createAdminNotifications({
      dossierId: updatedPayment.dossier.id,
      type: "PAYMENT_PAID",
      title: "Paiement client confirmé",
      message: `Le paiement "${updatedPayment.label}" du dossier ${updatedPayment.dossier.title} est confirmé.`,
      preferEmail: true
    });
  }

  if (eventType === "checkout.session.expired") {
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: "FAILED",
        provider: "stripe",
        providerSessionId: object.id || null
      },
      include: {
        dossier: {
          select: {
            id: true,
            title: true
          }
        },
        client: {
          select: {
            userId: true,
            user: {
              select: {
                email: true
              }
            }
          }
        }
      }
    });

    await prisma.auditLog.create({
      data: {
        entityType: "Payment",
        entityId: paymentId,
        action: "WEBHOOK_EXPIRED",
        metadata: {
          eventType,
          providerSessionId: object.id || null
        }
      }
    });

    await createUserNotification({
      userId: updatedPayment.client.userId,
      recipientEmail: updatedPayment.client.user.email,
      dossierId: updatedPayment.dossier.id,
      type: "PAYMENT_FAILED",
      title: "Paiement non finalisé",
      message: `Le paiement "${updatedPayment.label}" n'a pas abouti. Vous pouvez réessayer depuis votre espace client.`,
      preferEmail: true
    });

    await createAdminNotifications({
      dossierId: updatedPayment.dossier.id,
      type: "PAYMENT_FAILED",
      title: "Paiement client échoué",
      message: `Le paiement "${updatedPayment.label}" du dossier ${updatedPayment.dossier.title} a échoué.`,
      preferEmail: true
    });
  }

  return Response.json({ received: true });
}
