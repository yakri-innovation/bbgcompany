import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import AdminNav from "@/components/AdminNav";
import AdminTeamPage from "@/components/AdminTeamPage";
import SiteHeader from "@/components/SiteHeader";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "BBG Company - Gestion de l'équipe",
  description: "Back-office BBG Company pour gérer les comptes managers et administrateurs."
};

const adminRoles = ["ADMIN", "SUPER_ADMIN"];
const staffRoles = ["MANAGER", "ADMIN", "SUPER_ADMIN"];

function serializeStaff(user) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt.toISOString(),
    lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
    assignedDossiers: user._count?.advisedDossiers ?? 0
  };
}

async function getUnreadNotificationCount(userId) {
  return prisma.notification.count({
    where: { userId, readAt: null, status: { not: "READ" } }
  });
}

export default async function AdminTeamRoute() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/connexion?callbackUrl=/admin/equipe");
  }

  if (session.user.role === "MANAGER") {
    redirect("/manager");
  }

  if (!adminRoles.includes(session.user.role)) {
    redirect("/espace-client");
  }

  const [users, unreadNotificationCount] = await Promise.all([
    prisma.user.findMany({
      where: { role: { in: staffRoles } },
      orderBy: [{ role: "desc" }, { email: "asc" }],
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        lastLoginAt: true,
        _count: { select: { advisedDossiers: true } }
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
      <AdminTeamPage
        initialUsers={users.map(serializeStaff)}
        currentUserId={session.user.id}
        currentUserRole={session.user.role}
      />
    </div>
  );
}
