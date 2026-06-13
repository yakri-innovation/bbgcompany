import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
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

export async function GET() {
  const session = await requireAdminSession();

  if (!session) {
    return Response.json({ error: "Accès refusé." }, { status: 403 });
  }

  const leads = await prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
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

  return Response.json({ leads: leads.map(serializeLead) });
}
