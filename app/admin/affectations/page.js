import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import AdminAssignmentsPage from "@/components/AdminAssignmentsPage";
import AdminNav from "@/components/AdminNav";
import SiteHeader from "@/components/SiteHeader";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "BBG Company - Affectations managers",
  description: "Affecter et réaffecter les dossiers clients aux managers depuis le back-office admin."
};

const adminRoles = ["ADMIN", "SUPER_ADMIN"];

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

function serializeManager(manager) {
  return {
    id: manager.id,
    email: manager.email,
    status: manager.status,
    role: manager.role
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

async function getAssignmentsPageData() {
  const [managers, dossiers] = await Promise.all([
    prisma.user.findMany({
      where: {
        role: "MANAGER",
        status: {
          not: "SUSPENDED"
        }
      },
      orderBy: { email: "asc" },
      select: {
        id: true,
        email: true,
        role: true,
        status: true
      }
    }),
    prisma.dossier.findMany({
      orderBy: { updatedAt: "desc" },
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
    })
  ]);

  return {
    managers: managers.map(serializeManager),
    dossiers: dossiers.map(serializeDossier)
  };
}

export default async function AdminAssignmentsPageRoute() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/connexion?callbackUrl=/admin/affectations");
  }

  if (session.user.role === "MANAGER") {
    redirect("/manager");
  }

  if (!adminRoles.includes(session.user.role)) {
    redirect("/espace-client");
  }

  const { managers, dossiers } = await getAssignmentsPageData();
  const unreadNotificationCount = await getUnreadNotificationCount(session.user.id);

  return (
    <div className="light-page">
      <SiteHeader light notificationCount={unreadNotificationCount} showNotificationCount hideSiteNav />
      <div className="container" style={{ paddingTop: 28 }}>
        <AdminNav />
      </div>
      <AdminAssignmentsPage initialManagers={managers} initialDossiers={dossiers} />
    </div>
  );
}
