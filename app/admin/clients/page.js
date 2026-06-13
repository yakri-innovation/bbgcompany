import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import AdminClientsPage from "@/components/AdminClientsPage";
import AdminNav from "@/components/AdminNav";
import SiteHeader from "@/components/SiteHeader";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "BBG Company - Gestion des clients",
  description: "Back-office BBG Company pour gérer les comptes clients."
};

const adminRoles = ["ADMIN", "SUPER_ADMIN"];

function serializeClient(user) {
  const profile = user.clientProfile;

  return {
    id: user.id,
    email: user.email,
    status: user.status,
    createdAt: user.createdAt.toISOString(),
    lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
    profileId: profile?.id ?? null,
    firstName: profile?.firstName ?? "",
    lastName: profile?.lastName ?? "",
    phone: profile?.phone ?? "",
    companyName: profile?.companyName ?? "",
    dossierCount: profile?._count?.dossiers ?? 0,
    leadCount: profile?._count?.leads ?? 0
  };
}

async function getUnreadNotificationCount(userId) {
  return prisma.notification.count({
    where: { userId, readAt: null, status: { not: "READ" } }
  });
}

export default async function AdminClientsRoute() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/connexion?callbackUrl=/admin/clients");
  }

  if (session.user.role === "MANAGER") {
    redirect("/manager");
  }

  if (!adminRoles.includes(session.user.role)) {
    redirect("/espace-client");
  }

  const [users, unreadNotificationCount] = await Promise.all([
    prisma.user.findMany({
      where: { role: "CLIENT" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        status: true,
        createdAt: true,
        lastLoginAt: true,
        clientProfile: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            companyName: true,
            _count: { select: { dossiers: true, leads: true } }
          }
        }
      }
    }),
    getUnreadNotificationCount(session.user.id)
  ]);

  return (
    <div className="light-page">
      <SiteHeader light notificationCount={unreadNotificationCount} showNotificationCount hideSiteNav />
      <div className="container" style={{ paddingTop: 28 }}>
        <AdminNav />
      </div>
      <AdminClientsPage initialClients={users.map(serializeClient)} />
    </div>
  );
}
