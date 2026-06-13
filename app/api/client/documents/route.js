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
      email: true,
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
    userEmail: user.email,
    clientId: user.clientProfile.id
  };
}

async function ensureClientDossierAccess(clientId, dossierId) {
  return prisma.dossier.findFirst({
    where: {
      id: dossierId,
      clientId
    },
    select: {
      id: true,
      title: true,
      payments: {
        select: {
          status: true
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
}

function serializeWithDossier(document) {
  return {
    ...serializeDocument(document),
    dossier: document.dossier
  };
}

export async function GET(request) {
  const clientSession = await requireClientSession();

  if (!clientSession) {
    return Response.json({ error: "Authentification client requise." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const dossierId = normalizeText(searchParams.get("dossierId") || "");

  const where = {
    clientId: clientSession.clientId,
    ...(dossierId ? { dossierId } : {})
  };

  const documents = await prisma.document.findMany({
    where,
    orderBy: { updatedAt: "desc" },
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

  return Response.json({
    documents: documents.map(serializeWithDossier)
  });
}

export async function POST(request) {
  const clientSession = await requireClientSession();

  if (!clientSession) {
    return Response.json({ error: "Authentification client requise." }, { status: 401 });
  }

  const body = await request.json();
  const dossierId = normalizeText(body.dossierId);
  const title = normalizeText(body.title);
  const type = normalizeText(body.type) || "OTHER";
  const fileName = normalizeText(body.fileName);
  const mimeType = normalizeText(body.mimeType);
  const fileKey = normalizeText(body.fileKey);
  const size = parseFileSize(body.size);

  if (!dossierId || !title || !fileName || !mimeType || size === null) {
    return Response.json({ error: "Dossier, titre et informations fichier valides sont obligatoires." }, { status: 400 });
  }

  const dossier = await ensureClientDossierAccess(clientSession.clientId, dossierId);

  if (!dossier) {
    return Response.json({ error: "Accès refusé à ce dossier." }, { status: 403 });
  }

  if (!isDossierDocumentUploadAllowed(dossier.payments)) {
    return Response.json({ error: documentUploadPaymentGateMessage }, { status: 403 });
  }

  const document = await prisma.document.create({
    data: {
      dossierId,
      clientId: clientSession.clientId,
      title,
      type,
      fileName,
      mimeType,
      fileKey: fileKey || null,
      size,
      status: "UPLOADED",
      uploadedById: clientSession.userId
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
    where: { id: dossier.id },
    data: {
      status: "DOCUMENT_RECEIVED"
    }
  });

  await prisma.auditLog.create({
    data: {
      actorId: clientSession.userId,
      entityType: "Document",
      entityId: document.id,
      action: "CLIENT_UPLOAD_CREATE",
      metadata: {
        dossierId,
        title,
        fileName,
        size
      }
    }
  });

  await createAdminNotifications({
    dossierId: dossier.id,
    type: "DOCUMENT_RECEIVED",
    title: "Document client déposé",
    message: `Le client a déposé "${document.title}" pour le dossier ${dossier.title}.`,
    preferEmail: true
  });

  return Response.json({ document: serializeWithDossier(document) }, { status: 201 });
}
