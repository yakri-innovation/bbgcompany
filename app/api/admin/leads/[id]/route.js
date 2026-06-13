import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth/options";
import { createAdminNotifications, createUserNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

const adminRoles = ["ADMIN", "SUPER_ADMIN"];
const allowedStatuses = ["NEW", "QUALIFIED", "CONVERTED", "ARCHIVED"];

const dossierTypeByLeadType = {
  GESTION_RH: "GESTION_RH",
  GESTION_COMPTA: "GESTION_COMPTA",
  CREATION: "CREATION",
  REPRISE: "REPRISE",
  ANNONCE: "ANNONCE",
  CONTACT: "OTHER"
};

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function generateTemporaryPassword() {
  const randomPart = Math.random().toString(36).slice(-8);
  return `BBG-${randomPart}`;
}

function serializeLead(lead) {
  const announcement = getAnnouncementMetadata(lead);

  return {
    ...lead,
    createdAt: lead.createdAt.toISOString(),
    updatedAt: lead.updatedAt.toISOString(),
    dossiers: lead.dossiers.map((dossier) => ({
      ...dossier,
      createdAt: dossier.createdAt.toISOString(),
      updatedAt: dossier.updatedAt.toISOString(),
      announcement
    }))
  };
}

async function requireAdminSession() {
  const session = await getServerSession(authOptions);

  if (!session?.user || !adminRoles.includes(session.user.role)) {
    return null;
  }

  return session;
}

async function getLead(id) {
  return prisma.lead.findUnique({
    where: { id },
    include: {
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          user: {
            select: {
              email: true,
              status: true
            }
          }
        }
      },
      assignedTo: {
        select: {
          id: true,
          email: true,
          role: true
        }
      },
      dossiers: {
        select: {
          id: true,
          title: true,
          status: true,
          type: true,
          createdAt: true,
          updatedAt: true,
          advisor: {
            select: {
              id: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: { createdAt: "desc" }
      }
    }
  });
}

function getClientNames(lead) {
  const payload = lead.payload && typeof lead.payload === "object" ? lead.payload : {};
  const firstName = normalizeText(lead.firstName) || normalizeText(payload.firstName) || "Client";
  const lastName = normalizeText(lead.lastName) || normalizeText(payload.lastName) || "BBG";

  return { firstName, lastName };
}

function getDossierTitle(lead) {
  const payload = lead.payload && typeof lead.payload === "object" ? lead.payload : {};
  const companyName = normalizeText(payload.companyName);
  const listingTitle = payload.listing && typeof payload.listing === "object" ? normalizeText(payload.listing.title) : "";
  const label = companyName || listingTitle || `${lead.type} - ${lead.email || lead.phone || lead.id.slice(0, 8)}`;

  return `Dossier ${label}`;
}

function getAnnouncementMetadata(lead) {
  const payload = lead.payload && typeof lead.payload === "object" ? lead.payload : {};
  const listing = payload.listing && typeof payload.listing === "object" ? payload.listing : null;

  if (!listing) {
    return null;
  }

  const announcementId = normalizeText(listing.id);
  const announcementSlug = normalizeText(listing.slug);
  const announcementTitle = normalizeText(listing.title);

  if (!announcementId && !announcementSlug && !announcementTitle) {
    return null;
  }

  return {
    announcementId: announcementId || null,
    announcementSlug: announcementSlug || null,
    announcementTitle: announcementTitle || null
  };
}

async function convertLeadToDossier(lead, session) {
  if (lead.dossiers.length > 0) {
    return lead;
  }

  const email = normalizeText(lead.email).toLowerCase();

  if (!email) {
    throw new Error("EMAIL_REQUIRED");
  }

  const { firstName, lastName } = getClientNames(lead);
  const phone = normalizeText(lead.phone) || undefined;
  const dossierType = dossierTypeByLeadType[lead.type] || "OTHER";
  const title = getDossierTitle(lead);
  const announcementMetadata = getAnnouncementMetadata(lead);
  const loginUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/connexion`;

  await prisma.$transaction(async (tx) => {
    let user = await tx.user.findUnique({
      where: { email },
      include: { clientProfile: true }
    });
    let invitationPassword = null;

    if (!user) {
      invitationPassword = generateTemporaryPassword();
      const passwordHash = await bcrypt.hash(invitationPassword, 10);

      user = await tx.user.create({
        data: {
          email,
          role: "CLIENT",
          status: "INVITED",
          passwordHash,
          clientProfile: {
            create: {
              firstName,
              lastName,
              phone
            }
          }
        },
        include: { clientProfile: true }
      });
    } else if (user.status === "INVITED" && !user.passwordHash) {
      invitationPassword = generateTemporaryPassword();
      const passwordHash = await bcrypt.hash(invitationPassword, 10);

      user = await tx.user.update({
        where: { id: user.id },
        data: { passwordHash },
        include: { clientProfile: true }
      });
    }

    let clientProfile = user.clientProfile;

    if (!clientProfile) {
      clientProfile = await tx.clientProfile.create({
        data: {
          userId: user.id,
          firstName,
          lastName,
          phone
        }
      });
    }

    const dossier = await tx.dossier.create({
      data: {
        clientId: clientProfile.id,
        leadId: lead.id,
        advisorId: session.user.id,
        type: dossierType,
        title,
        status: "NEW",
        steps: {
          create: [
            { order: 1, title: "Qualification", description: "Analyse de la demande reçue", status: "ACTIVE" },
            { order: 2, title: "Documents", description: "Collecte et validation des pièces", status: "PENDING" },
            { order: 3, title: "Traitement", description: "Traitement administratif du dossier", status: "PENDING" },
            { order: 4, title: "Finalisation", description: "Clôture et mise à disposition des éléments", status: "PENDING" }
          ]
        }
      }
    });

    await tx.lead.update({
      where: { id: lead.id },
      data: {
        status: "CONVERTED",
        clientId: clientProfile.id,
        assignedToId: session.user.id
      }
    });

    await tx.auditLog.create({
      data: {
        actorId: session.user.id,
        entityType: "Lead",
        entityId: lead.id,
        action: "CONVERT_TO_DOSSIER",
        metadata: {
          dossierId: dossier.id,
          clientId: clientProfile.id,
          ...(announcementMetadata || {})
        }
      }
    });

    await createUserNotification({
      db: tx,
      userId: user.id,
      recipientEmail: user.email,
      dossierId: dossier.id,
      type: "DOSSIER_CREATED",
      title: "Votre dossier est créé",
      message: `Votre ${dossier.title} a été ouvert dans votre espace client.`,
      preferEmail: true
    });

    if (invitationPassword) {
      await createUserNotification({
        db: tx,
        userId: user.id,
        recipientEmail: user.email,
        dossierId: dossier.id,
        type: "ACCOUNT_INVITATION",
        title: "Vos accès à l'espace client",
        message: `Votre compte est prêt. Identifiant: ${user.email} | Mot de passe temporaire: ${invitationPassword}. Connectez-vous sur ${loginUrl} et modifiez votre mot de passe dès la première connexion.`,
        preferEmail: true
      });
    }

    await createAdminNotifications({
      db: tx,
      dossierId: dossier.id,
      type: "LEAD_CONVERTED",
      title: "Lead converti en dossier",
      message: `Le lead ${lead.id.slice(0, 8)} a été converti en ${dossier.title}.`,
      preferEmail: true
    });
  });

  return getLead(lead.id);
}

export async function PATCH(request, { params }) {
  const session = await requireAdminSession();

  if (!session) {
    return Response.json({ error: "Accès refusé." }, { status: 403 });
  }

  const lead = await getLead(params.id);

  if (!lead) {
    return Response.json({ error: "Demande introuvable." }, { status: 404 });
  }

  const body = await request.json();

  if (body.action === "convert") {
    try {
      const convertedLead = await convertLeadToDossier(lead, session);
      return Response.json({ lead: serializeLead(convertedLead) });
    } catch (error) {
      if (error.message === "EMAIL_REQUIRED") {
        return Response.json({ error: "Un email est nécessaire pour convertir cette demande en dossier client." }, { status: 400 });
      }

      console.error("Lead conversion failed", error);
      return Response.json({ error: "Impossible de convertir cette demande." }, { status: 500 });
    }
  }

  const status = normalizeText(body.status);

  if (!allowedStatuses.includes(status)) {
    return Response.json({ error: "Statut invalide." }, { status: 400 });
  }

  await prisma.lead.update({
    where: { id: lead.id },
    data: {
      status,
      assignedToId: session.user.id
    }
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      entityType: "Lead",
      entityId: lead.id,
      action: "UPDATE_STATUS",
      metadata: { status }
    }
  });

  await createAdminNotifications({
    dossierId: null,
    type: "LEAD_STATUS_UPDATED",
    title: "Statut lead mis à jour",
    message: `Le lead ${lead.id.slice(0, 8)} est passé au statut ${status}.`,
    preferEmail: true
  });

  const updatedLead = await getLead(lead.id);

  return Response.json({ lead: serializeLead(updatedLead) });
}
