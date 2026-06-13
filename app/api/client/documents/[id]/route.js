import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { createAdminNotifications } from "@/lib/notifications";
import { documentUploadPaymentGateMessage, isDossierDocumentUploadAllowed } from "@/lib/payments";
import { serializeDocument } from "@/lib/documents";
import { prisma } from "@/lib/prisma";

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function parseFileSize(value) {
  if (typeof value === "number" && Number.isInteger(value) && value >= 0) {
    return value;
  }

  if (typeof value === "string") {
    const numeric = Number(value);

    if (Number.isInteger(numeric) && numeric >= 0) {
      return numeric;
    }
  }

  return null;
}

async function requireClientSession() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      clientProfile: {
        select: {
          id: true
        }
      }
    }
  });

  if (!user?.clientProfile?.id) {
    return null;
  }

  return {
    userId: user.id,
    clientId: user.clientProfile.id
  };
}

function serializeWithDossier(document) {
  return {
    ...serializeDocument(document),
    dossier: document.dossier
  };
}

export async function PATCH(request, { params }) {
  const clientSession = await requireClientSession();

  if (!clientSession) {
    return Response.json({ error: "Authentification client requise." }, { status: 401 });
  }

  const document = await prisma.document.findUnique({
    where: { id: params.id },
    include: {
      dossier: {
        select: {
          id: true,
          title: true,
          status: true,
          payments: {
            select: {
              status: true
            }
          }
        }
      }
    }
  });

  if (!document) {
    return Response.json({ error: "Document introuvable." }, { status: 404 });
  }

  if (document.clientId !== clientSession.clientId) {
    return Response.json({ error: "Accès refusé." }, { status: 403 });
  }

  if (!isDossierDocumentUploadAllowed(document.dossier.payments)) {
    return Response.json({ error: documentUploadPaymentGateMessage }, { status: 403 });
  }

  const body = await request.json();
  const fileName = normalizeText(body.fileName);
  const mimeType = normalizeText(body.mimeType);
  const fileKey = normalizeText(body.fileKey);
  const size = parseFileSize(body.size);

  if (!fileName || !mimeType || size === null) {
    return Response.json({ error: "Informations fichier invalides." }, { status: 400 });
  }

  const updatedDocument = await prisma.document.update({
    where: { id: document.id },
    data: {
      fileName,
      mimeType,
      fileKey: fileKey || null,
      size,
      status: "UPLOADED",
      rejectionReason: null,
      uploadedById: clientSession.userId,
      version: document.fileName ? document.version + 1 : document.version
    },
    include: {
      dossier: {
        select: {
          id: true,
          title: true,
          status: true
        }
      }
    }
  });

  await prisma.dossier.update({
    where: { id: document.dossierId },
    data: {
      status: "DOCUMENT_RECEIVED"
    }
  });

  await prisma.auditLog.create({
    data: {
      actorId: clientSession.userId,
      entityType: "Document",
      entityId: document.id,
      action: "CLIENT_UPLOAD_UPDATE",
      metadata: {
        dossierId: document.dossierId,
        title: document.title,
        fileName,
        size
      }
    }
  });

  await createAdminNotifications({
    dossierId: document.dossierId,
    type: "DOCUMENT_RECEIVED",
    title: "Document client mis à jour",
    message: `Le client a mis à jour "${document.title}" pour le dossier ${document.dossier.title}.`,
    preferEmail: true
  });

  return Response.json({ document: serializeWithDossier(updatedDocument) });
}
