import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { createUserNotification } from "@/lib/notifications";
import { serializeDocument } from "@/lib/documents";
import { prisma } from "@/lib/prisma";

const adminRoles = ["ADMIN", "SUPER_ADMIN"];

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

export async function GET(request) {
  const session = await requireAdminSession();

  if (!session) {
    return Response.json({ error: "Accès refusé." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const dossierId = normalizeText(searchParams.get("dossierId") || "");
  const status = normalizeText(searchParams.get("status") || "");

  const documents = await prisma.document.findMany({
    where: {
      ...(dossierId ? { dossierId } : {}),
      ...(status ? { status } : {})
    },
    orderBy: { updatedAt: "desc" },
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

  const dossiers = await prisma.dossier.findMany({
    orderBy: { createdAt: "desc" },
    include: {
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
  });

  return Response.json({
    documents: documents.map(serializeDocumentWithRelations),
    dossiers: dossiers.map((dossier) => ({
      id: dossier.id,
      title: dossier.title,
      status: dossier.status,
      client: dossier.client
    }))
  });
}

export async function POST(request) {
  const session = await requireAdminSession();

  if (!session) {
    return Response.json({ error: "Accès refusé." }, { status: 403 });
  }

  const body = await request.json();
  const dossierId = normalizeText(body.dossierId);
  const title = normalizeText(body.title);
  const type = normalizeText(body.type) || "OTHER";

  if (!dossierId || !title) {
    return Response.json({ error: "Dossier et titre sont obligatoires." }, { status: 400 });
  }

  const dossier = await prisma.dossier.findUnique({
    where: { id: dossierId },
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

  const document = await prisma.document.create({
    data: {
      dossierId: dossier.id,
      clientId: dossier.clientId,
      title,
      type,
      status: "REQUESTED"
    },
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

  await prisma.dossier.update({
    where: { id: dossier.id },
    data: {
      status: "DOCUMENT_REQUESTED"
    }
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      entityType: "Document",
      entityId: document.id,
      action: "ADMIN_REQUEST",
      metadata: {
        dossierId: dossier.id,
        title: document.title,
        type: document.type
      }
    }
  });

  await createUserNotification({
    userId: dossier.client.userId,
    recipientEmail: dossier.client.user.email,
    dossierId: dossier.id,
    type: "DOCUMENT_REQUESTED",
    title: "Nouveau document demandé",
    message: `Le document "${document.title}" est attendu pour votre dossier ${dossier.title}.`,
    preferEmail: true
  });

  return Response.json({ document: serializeDocumentWithRelations(document) }, { status: 201 });
}
