import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { createUserNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

const adminRoles = ["ADMIN", "SUPER_ADMIN"];

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getLeadAnnouncementMetadata(lead) {
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

function serializeDossier(dossier) {
  return {
    ...dossier,
    createdAt: dossier.createdAt.toISOString(),
    updatedAt: dossier.updatedAt.toISOString(),
    closedAt: dossier.closedAt ? dossier.closedAt.toISOString() : null
  };
}

function serializeLead(lead) {
  const announcement = getLeadAnnouncementMetadata(lead);

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

async function getLead(leadId) {
  return prisma.lead.findUnique({
    where: { id: leadId },
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

export async function PATCH(request, { params }) {
  const session = await requireAdminSession();

  if (!session) {
    return Response.json({ error: "Accès refusé." }, { status: 403 });
  }

  const body = await request.json();
  const managerId = normalizeText(body.managerId);

  if (!managerId) {
    return Response.json({ error: "Manager requis." }, { status: 400 });
  }

  const [manager, dossier] = await Promise.all([
    prisma.user.findUnique({
      where: { id: managerId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true
      }
    }),
    prisma.dossier.findUnique({
      where: { id: params.id },
      include: {
        lead: {
          select: {
            id: true
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
    })
  ]);

  if (!manager || manager.role !== "MANAGER" || manager.status === "SUSPENDED") {
    return Response.json({ error: "Manager invalide." }, { status: 400 });
  }

  if (!dossier) {
    return Response.json({ error: "Dossier introuvable." }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.dossier.update({
      where: { id: dossier.id },
      data: {
        advisorId: manager.id,
        status: dossier.status === "NEW" ? "IN_PROGRESS" : dossier.status
      }
    });

    await tx.auditLog.create({
      data: {
        actorId: session.user.id,
        entityType: "Dossier",
        entityId: dossier.id,
        action: "ASSIGN_MANAGER",
        metadata: {
          managerId: manager.id,
          managerEmail: manager.email,
          leadId: dossier.leadId
        }
      }
    });

    await createUserNotification({
      db: tx,
      userId: manager.id,
      recipientEmail: manager.email,
      dossierId: dossier.id,
      type: "DOSSIER_ASSIGNED",
      title: "Nouveau dossier affecté",
      message: `Le dossier ${dossier.title} vous a été affecté par l'administration.`,
      preferEmail: true
    });

    await createUserNotification({
      db: tx,
      userId: dossier.client.userId,
      recipientEmail: dossier.client.user.email,
      dossierId: dossier.id,
      type: "MANAGER_ASSIGNED",
      title: "Manager affecté à votre dossier",
      message: `Votre dossier ${dossier.title} est désormais suivi par ${manager.email}.`,
      preferEmail: true
    });
  });

  const updatedDossier = await prisma.dossier.findUnique({
    where: { id: dossier.id },
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
      advisor: {
        select: {
          id: true,
          email: true,
          role: true,
          status: true
        }
      },
      lead: {
        select: {
          id: true,
          type: true,
          source: true
        }
      }
    }
  });

  if (!updatedDossier) {
    return Response.json({ error: "Dossier introuvable après affectation." }, { status: 404 });
  }

  if (!dossier.leadId) {
    return Response.json({ dossier: serializeDossier(updatedDossier), lead: null });
  }

  const updatedLead = await getLead(dossier.leadId);

  if (!updatedLead) {
    return Response.json({ error: "Lead introuvable après affectation." }, { status: 404 });
  }

  return Response.json({
    lead: serializeLead(updatedLead),
    dossier: serializeDossier(updatedDossier)
  });
}
