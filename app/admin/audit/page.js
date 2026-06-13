import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import AdminAuditPage from "@/components/AdminAuditPage";
import AdminNav from "@/components/AdminNav";
import SiteHeader from "@/components/SiteHeader";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "BBG Company - Journal d'audit",
  description: "Journal d'activité du back-office BBG Company pour tracer toutes les actions sensibles."
};

const adminRoles = ["ADMIN", "SUPER_ADMIN"];
const AUDIT_LIMIT = 300;

function summarizeMetadata(metadata) {
  if (!metadata || typeof metadata !== "object") {
    return "";
  }

  return Object.entries(metadata)
    .filter(([, value]) => value !== null && value !== undefined && value !== "")
    .slice(0, 4)
    .map(([key, value]) => {
      const display = typeof value === "object" ? JSON.stringify(value) : String(value);
      return `${key}: ${display.length > 40 ? `${display.slice(0, 40)}…` : display}`;
    })
    .join(" · ");
}

function serializeLog(log) {
  return {
    id: log.id,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    createdAt: log.createdAt.toISOString(),
    actorEmail: log.actor?.email || "Système",
    actorRole: log.actor?.role || null,
    metadataSummary: summarizeMetadata(log.metadata)
  };
}

async function getUnreadNotificationCount(userId) {
  return prisma.notification.count({
    where: { userId, readAt: null, status: { not: "READ" } }
  });
}

export default async function AdminAuditRoute() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/connexion?callbackUrl=/admin/audit");
  }

  if (session.user.role === "MANAGER") {
    redirect("/manager");
  }

  if (!adminRoles.includes(session.user.role)) {
    redirect("/espace-client");
  }

  const [logs, unreadNotificationCount] = await Promise.all([
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: AUDIT_LIMIT,
      include: {
        actor: { select: { email: true, role: true } }
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
      <AdminAuditPage initialLogs={logs.map(serializeLog)} />
    </div>
  );
}
