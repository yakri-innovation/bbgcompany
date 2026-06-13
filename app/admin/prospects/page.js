import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import AdminLeadsPage from "@/components/AdminLeadsPage";
import AdminNav from "@/components/AdminNav";
import SiteHeader from "@/components/SiteHeader";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "BBG Company - Prospects",
  description: "Back-office BBG Company pour gérer les prospects et les dossiers clients."
};

const adminRoles = ["ADMIN", "SUPER_ADMIN"];

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

async function getUnreadNotificationCount(userId) {
  return prisma.notification.count({
    where: {
      userId,
      readAt: null,
      status: {
        not: "READ"
      }
    }
  });
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

async function getLeads() {
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

  return leads.map(serializeLead);
}

export default async function AdminProspectsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/connexion?callbackUrl=/admin/prospects");
  }

  if (session.user.role === "MANAGER") {
    redirect("/manager");
  }

  if (!adminRoles.includes(session.user.role)) {
    redirect("/espace-client");
  }

  const [leads, unreadNotificationCount] = await Promise.all([
    getLeads(),
    getUnreadNotificationCount(session.user.id)
  ]);

  return (
    <div className="light-page">
      <SiteHeader light notificationCount={unreadNotificationCount} showNotificationCount hideSiteNav />
      <div className="container" style={{ paddingTop: 28 }}>
        <AdminNav />
      </div>
      <AdminLeadsPage initialLeads={leads} />
    </div>
  );
}
