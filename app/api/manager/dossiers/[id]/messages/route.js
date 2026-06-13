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

export async function POST(request, { params }) {
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
  const message = normalizeText(body.message);

  if (!message) {
    return Response.json({ error: "Le message est obligatoire." }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    await createUserNotification({
      db: tx,
      userId: dossier.client.userId,
      recipientEmail: dossier.client.user.email,
      dossierId: dossier.id,
      type: "MANAGER_MESSAGE",
      title: "Message de votre manager BBG",
      message,
      preferEmail: true
    });

    await createAdminNotifications({
      db: tx,
      dossierId: dossier.id,
      type: "MANAGER_MESSAGE_SENT",
      title: "Message manager envoyé",
      message: `Le manager a envoyé un message au client pour le dossier ${dossier.title}.`,
      preferEmail: false
    });

    await tx.auditLog.create({
      data: {
        actorId: session.user.id,
        entityType: "Dossier",
        entityId: dossier.id,
        action: "MANAGER_MESSAGE",
        metadata: {
          message
        }
      }
    });
  });

  return Response.json({ success: true });
}
