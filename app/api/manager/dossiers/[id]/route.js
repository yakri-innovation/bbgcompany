import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { createAdminNotifications, createUserNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

const allowedRoles = ["MANAGER", "ADMIN", "SUPER_ADMIN"];

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

  const dossier = await prisma.dossier.findUnique({
    where: { id: params.id },
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
  });

  if (!dossier) {
    return Response.json({ error: "Dossier introuvable." }, { status: 404 });
  }

  if (!canManageDossier(session, dossier)) {
    return Response.json({ error: "Ce dossier n'est pas affecté à votre compte manager." }, { status: 403 });
  }

  const body = await request.json();
  const action = normalizeText(body.action);

  if (action !== "validate") {
    return Response.json({ error: "Action manager invalide." }, { status: 400 });
  }

  const hasPendingDocuments = await prisma.document.count({
    where: {
      dossierId: dossier.id,
      status: {
        in: ["REQUESTED", "UPLOADED", "REVIEWING", "REJECTED"]
      }
    }
  });

  if (hasPendingDocuments > 0) {
    return Response.json({ error: "Tous les documents doivent être validés avant la validation du dossier." }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.dossier.update({
      where: { id: dossier.id },
      data: {
        status: "WAITING_VALIDATION"
      }
    });

    await tx.auditLog.create({
      data: {
        actorId: session.user.id,
        entityType: "Dossier",
        entityId: dossier.id,
        action: "MANAGER_VALIDATE",
        metadata: {
          previousStatus: dossier.status,
          nextStatus: "WAITING_VALIDATION"
        }
      }
    });

    await createAdminNotifications({
      db: tx,
      dossierId: dossier.id,
      type: "DOSSIER_MANAGER_VALIDATED",
      title: "Dossier validé par manager",
      message: `Le dossier ${dossier.title} est prêt pour validation finale admin.`,
      preferEmail: true
    });

    await createUserNotification({
      db: tx,
      userId: dossier.client.userId,
      recipientEmail: dossier.client.user.email,
      dossierId: dossier.id,
      type: "DOSSIER_PROGRESS",
      title: "Votre dossier progresse",
      message: `Votre dossier ${dossier.title} a été validé par votre manager et est en attente de validation finale.`,
      preferEmail: true
    });
  });

  const updatedDossier = await getDossierForManager(dossier.id);

  return Response.json({ dossier: serializeDossier(updatedDossier) });
}
