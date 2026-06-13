import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { createUserNotification } from "@/lib/notifications";
import { serializeDocument } from "@/lib/documents";
import { prisma } from "@/lib/prisma";

const adminRoles = ["ADMIN", "SUPER_ADMIN"];
const allowedStatuses = ["REVIEWING", "VALIDATED", "REJECTED", "REQUESTED"];

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

function serializeDocumentWithRelations(document) {
  return {
    ...serializeDocument(document),
    dossier: document.dossier,
    client: document.client,
    uploadedBy: document.uploadedBy,
    validatedBy: document.validatedBy
  };
}

export async function PATCH(request, { params }) {
  const session = await requireAdminSession();

  if (!session) {
    return Response.json({ error: "Accès refusé." }, { status: 403 });
  }

  const document = await prisma.document.findUnique({
    where: { id: params.id },
    include: {
      dossier: {
        select: {
          id: true,
          title: true,
          status: true
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

  if (!document) {
    return Response.json({ error: "Document introuvable." }, { status: 404 });
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

  const data = {
    status,
    rejectionReason: status === "REJECTED" ? rejectionReason : null
  };

  if (["VALIDATED", "REJECTED"].includes(status)) {
    data.validatedById = session.user.id;
  }

  const updatedDocument = await prisma.document.update({
    where: { id: document.id },
    data,
    include: {
      dossier: {
        select: {
          id: true,
          title: true,
          status: true
        }
      },
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          user: {
            select: {
              id: true,
              email: true
            }
          }
        }
      },
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
  });

  if (status === "VALIDATED") {
    await prisma.dossier.update({
      where: { id: document.dossierId },
      data: {
        status: "IN_PROGRESS"
      }
    });
  }

  if (status === "REJECTED") {
    await prisma.dossier.update({
      where: { id: document.dossierId },
      data: {
        status: "DOCUMENT_REQUESTED"
      }
    });
  }

  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      entityType: "Document",
      entityId: document.id,
      action: "ADMIN_REVIEW",
      metadata: {
        dossierId: document.dossierId,
        previousStatus: document.status,
        nextStatus: status,
        rejectionReason: status === "REJECTED" ? rejectionReason : null
      }
    }
  });

  const statusMessage =
    status === "VALIDATED"
      ? `Le document "${document.title}" a été validé.`
      : status === "REJECTED"
        ? `Le document "${document.title}" a été refusé : ${rejectionReason}`
        : status === "REVIEWING"
          ? `Le document "${document.title}" est en cours de vérification.`
          : `Le document "${document.title}" est demandé.`;

  await createUserNotification({
    userId: document.client.userId,
    recipientEmail: document.client.user.email,
    dossierId: document.dossierId,
    type: status === "VALIDATED" ? "DOCUMENT_VALIDATED" : status === "REJECTED" ? "DOCUMENT_REJECTED" : "DOCUMENT_STATUS_UPDATED",
    title: "Mise à jour document",
    message: `${statusMessage} Dossier : ${document.dossier.title}.`,
    preferEmail: true
  });

  return Response.json({ document: serializeDocumentWithRelations(updatedDocument) });
}
