import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { createUserNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

const allowedRoles = ["MANAGER", "ADMIN", "SUPER_ADMIN"];
const allowedStatuses = ["REVIEWING", "VALIDATED", "REJECTED", "REQUESTED"];

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

async function requireManagerSession() {
  const session = await getServerSession(authOptions);

  if (!session?.user || !allowedRoles.includes(session.user.role)) {
    return null;
  }

  return session;
}

function canManageDossier(session, dossier) {
  if (["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return true;
  }

  return dossier.advisorId === session.user.id;
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

async function getDossierForManager(dossierId) {
  return prisma.dossier.findUnique({
    where: { id: dossierId },
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
  });
}

export async function PATCH(request, { params }) {
  const session = await requireManagerSession();

  if (!session) {
    return Response.json({ error: "Accès refusé." }, { status: 403 });
  }

  const existingDocument = await prisma.document.findUnique({
    where: { id: params.id },
    include: {
      dossier: {
        select: {
          id: true,
          title: true,
          advisorId: true
        }
      },
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
  });

  if (!existingDocument) {
    return Response.json({ error: "Document introuvable." }, { status: 404 });
  }

  if (!canManageDossier(session, existingDocument.dossier)) {
    return Response.json({ error: "Ce dossier n'est pas affecté à votre compte manager." }, { status: 403 });
  }

  const body = await request.json();
  const status = normalizeText(body.status).toUpperCase();
  const rejectionReason = normalizeText(body.rejectionReason);

  if (!allowedStatuses.includes(status)) {
    return Response.json({ error: "Statut document invalide." }, { status: 400 });
  }

  if (status === "REJECTED" && !rejectionReason) {
    return Response.json({ error: "Le motif de rejet est obligatoire." }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.document.update({
      where: { id: existingDocument.id },
      data: {
        status,
        rejectionReason: status === "REJECTED" ? rejectionReason : null,
        validatedById: ["VALIDATED", "REJECTED"].includes(status) ? session.user.id : null
      }
    });

    await tx.dossier.update({
      where: { id: existingDocument.dossierId },
      data: {
        status: status === "VALIDATED" ? "IN_PROGRESS" : status === "REJECTED" ? "DOCUMENT_REQUESTED" : "DOCUMENT_RECEIVED"
      }
    });

    await tx.auditLog.create({
      data: {
        actorId: session.user.id,
        entityType: "Document",
        entityId: existingDocument.id,
        action: "MANAGER_REVIEW",
        metadata: {
          dossierId: existingDocument.dossierId,
          previousStatus: existingDocument.status,
          nextStatus: status,
          rejectionReason: status === "REJECTED" ? rejectionReason : null
        }
      }
    });

    const statusMessage =
      status === "VALIDATED"
        ? `Le document \"${existingDocument.title}\" a été validé.`
        : status === "REJECTED"
          ? `Le document \"${existingDocument.title}\" a été refusé : ${rejectionReason}`
          : status === "REVIEWING"
            ? `Le document \"${existingDocument.title}\" est en cours de vérification.`
            : `Le document \"${existingDocument.title}\" est à fournir.`;

    await createUserNotification({
      db: tx,
      userId: existingDocument.client.userId,
      recipientEmail: existingDocument.client.user.email,
      dossierId: existingDocument.dossierId,
      type: status === "VALIDATED" ? "DOCUMENT_VALIDATED" : status === "REJECTED" ? "DOCUMENT_REJECTED" : "DOCUMENT_STATUS_UPDATED",
      title: "Mise à jour document",
      message: `${statusMessage} Dossier : ${existingDocument.dossier.title}.`,
      preferEmail: true
    });
  });

  const updatedDossier = await getDossierForManager(existingDocument.dossierId);

  return Response.json({ dossier: serializeDossier(updatedDossier) });
}
