import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { createAdminNotifications, createUserNotification } from "@/lib/notifications";
import { serializePayment } from "@/lib/payments";
import { prisma } from "@/lib/prisma";

const adminRoles = ["ADMIN", "SUPER_ADMIN"];
const allowedStatuses = ["DRAFT", "REQUESTED", "PENDING", "PAID", "FAILED", "REFUNDED", "CANCELLED"];

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

async function requireAdminSession() {
  const session = await getServerSession(authOptions);

  if (!session?.user || !adminRoles.includes(session.user.role)) {
    return null;
  }

  return session;
}

function serializePaymentWithRelations(payment) {
  return {
    ...serializePayment(payment),
    dossier: {
      ...payment.dossier,
      createdAt: payment.dossier.createdAt.toISOString(),
      updatedAt: payment.dossier.updatedAt.toISOString(),
      client: {
        id: payment.dossier.client.id,
        firstName: payment.dossier.client.firstName,
        lastName: payment.dossier.client.lastName,
        user: {
          email: payment.dossier.client.user.email
        }
      }
    }
  };
}

export async function PATCH(request, { params }) {
  const session = await requireAdminSession();

  if (!session) {
    return Response.json({ error: "Accès refusé." }, { status: 403 });
  }

  const payment = await prisma.payment.findUnique({
    where: { id: params.id },
    include: {
      dossier: {
        include: {
          client: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!payment) {
    return Response.json({ error: "Paiement introuvable." }, { status: 404 });
  }

  const body = await request.json();
  const status = normalizeText(body.status).toUpperCase();

  if (!allowedStatuses.includes(status)) {
    return Response.json({ error: "Statut de paiement invalide." }, { status: 400 });
  }

  const updateData = {
    status,
    paidAt: status === "PAID" ? new Date() : null
  };

  const updatedPayment = await prisma.payment.update({
    where: { id: payment.id },
    data: updateData,
    include: {
      dossier: {
        select: {
          id: true,
          title: true,
          status: true,
          type: true,
          createdAt: true,
          updatedAt: true,
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              user: {
                select: {
                  email: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (status === "PAID") {
    await prisma.dossier.update({
      where: { id: payment.dossierId },
      data: {
        status: "IN_PROGRESS"
      }
    });
  }

  if (["REQUESTED", "PENDING"].includes(status)) {
    await prisma.dossier.update({
      where: { id: payment.dossierId },
      data: {
        status: "PAYMENT_REQUESTED"
      }
    });
  }

  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      entityType: "Payment",
      entityId: payment.id,
      action: "ADMIN_STATUS_UPDATE",
      metadata: {
        dossierId: payment.dossierId,
        previousStatus: payment.status,
        nextStatus: status
      }
    }
  });

  await createUserNotification({
    userId: payment.dossier.client.userId,
    recipientEmail: payment.dossier.client.user.email,
    dossierId: payment.dossierId,
    type: "PAYMENT_STATUS_UPDATED",
    title: "Mise à jour paiement",
    message: `Le paiement "${payment.label}" est maintenant au statut ${status}.`,
    preferEmail: true
  });

  await createAdminNotifications({
    dossierId: payment.dossierId,
    type: "PAYMENT_STATUS_UPDATED",
    title: "Paiement mis à jour",
    message: `Le paiement "${payment.label}" est passé de ${payment.status} à ${status}.`,
    preferEmail: true
  });

  return Response.json({ payment: serializePaymentWithRelations(updatedPayment) });
}
