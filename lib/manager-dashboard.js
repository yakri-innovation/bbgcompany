import { serializeNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

export const managerDossierStatusLabels = {
  NEW: "Nouveau",
  WAITING_VALIDATION: "En attente",
  IN_PROGRESS: "En cours",
  DOCUMENT_REQUESTED: "Document demandé",
  DOCUMENT_RECEIVED: "Document reçu",
  PAYMENT_REQUESTED: "Paiement demandé",
  PROCESSING: "Traitement",
  COMPLETED: "Finalisé",
  ARCHIVED: "Archivé",
  CANCELLED: "Annulé"
};

export const managerDocumentStatusLabels = {
  REQUESTED: "Demandé",
  UPLOADED: "Déposé",
  REVIEWING: "Vérification",
  VALIDATED: "Validé",
  REJECTED: "Refusé",
  EXPIRED: "Expiré",
  AVAILABLE: "Disponible"
};

export function formatManagerDate(value) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function getManagerClientLabel(dossier) {
  const fullName = [dossier.client.firstName, dossier.client.lastName].filter(Boolean).join(" ");
  return `${fullName || "Client"} · ${dossier.client.user.email}`;
}

function serializeDossier(dossier) {
  return {
    ...dossier,
    createdAt: dossier.createdAt.toISOString(),
    updatedAt: dossier.updatedAt.toISOString(),
    closedAt: dossier.closedAt ? dossier.closedAt.toISOString() : null,
    steps: dossier.steps.map((step) => ({
      ...step,
      dueDate: step.dueDate ? step.dueDate.toISOString() : null,
      completedAt: step.completedAt ? step.completedAt.toISOString() : null
    })),
    documents: dossier.documents.map((document) => ({
      ...document,
      createdAt: document.createdAt.toISOString(),
      updatedAt: document.updatedAt.toISOString()
    })),
    payments: dossier.payments.map((payment) => ({
      ...payment,
      createdAt: payment.createdAt.toISOString(),
      paidAt: payment.paidAt ? payment.paidAt.toISOString() : null
    }))
  };
}

export function countManagerUnreadNotifications(notifications) {
  return notifications.filter((notification) => notification.status !== "READ" && !notification.readAt).length;
}

export function countManagerPendingDocuments(dossiers) {
  return dossiers.reduce(
    (count, dossier) =>
      count + dossier.documents.filter((document) => ["UPLOADED", "REVIEWING", "REJECTED"].includes(document.status)).length,
    0
  );
}

export async function getManagerDashboardData(userId) {
  const [dossiers, notifications] = await Promise.all([
    prisma.dossier.findMany({
      where: { advisorId: userId },
      orderBy: { updatedAt: "desc" },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            companyName: true,
            user: {
              select: {
                id: true,
                email: true
              }
            }
          }
        },
        lead: {
          select: {
            id: true,
            type: true,
            source: true,
            createdAt: true
          }
        },
        steps: {
          orderBy: { order: "asc" }
        },
        documents: {
          orderBy: { updatedAt: "desc" },
          include: {
            uploadedBy: {
              select: {
                id: true,
                email: true
              }
            },
            validatedBy: {
              select: {
                id: true,
                email: true
              }
            }
          }
        },
        payments: {
          orderBy: { createdAt: "desc" }
        }
      }
    }),
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 8
    })
  ]);

  return {
    dossiers: dossiers.map(serializeDossier),
    notifications: notifications.map(serializeNotification)
  };
}
