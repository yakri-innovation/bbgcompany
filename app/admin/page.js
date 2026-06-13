import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import AdminDashboard from "@/components/AdminDashboard";
import SiteHeader from "@/components/SiteHeader";
import { authOptions } from "@/lib/auth/options";
import { serializeNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "BBG Company - Tableau de bord",
  description: "Tableau de bord back-office BBG Company : pilotage des prospects, dossiers et facturation."
};

const adminRoles = ["ADMIN", "SUPER_ADMIN"];

const leadStatuses = ["NEW", "QUALIFIED", "CONVERTED", "ARCHIVED"];
const leadTypes = ["GESTION_RH", "GESTION_COMPTA", "CREATION", "REPRISE", "ANNONCE", "CONTACT"];
const dossierStatuses = [
  "NEW",
  "WAITING_VALIDATION",
  "IN_PROGRESS",
  "DOCUMENT_REQUESTED",
  "DOCUMENT_RECEIVED",
  "PAYMENT_REQUESTED",
  "PROCESSING",
  "COMPLETED",
  "ARCHIVED",
  "CANCELLED"
];
const activeDossierStatuses = [
  "NEW",
  "WAITING_VALIDATION",
  "IN_PROGRESS",
  "DOCUMENT_REQUESTED",
  "DOCUMENT_RECEIVED",
  "PAYMENT_REQUESTED",
  "PROCESSING"
];
const pendingDocumentStatuses = ["UPLOADED", "REVIEWING", "REJECTED"];
const pendingPaymentStatuses = ["REQUESTED", "PENDING"];

function getClientName(client) {
  if (!client) {
    return "Client BBG";
  }

  const fullName = [client.firstName, client.lastName].filter(Boolean).join(" ");
  return fullName || client.user?.email || "Client BBG";
}

function buildLeadTrend(leads, days = 14) {
  const buckets = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - i);
    buckets.push({
      key: date.toISOString().slice(0, 10),
      label: new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit" }).format(date),
      value: 0
    });
  }

  const indexByKey = new Map(buckets.map((bucket, index) => [bucket.key, index]));

  leads.forEach((lead) => {
    const key = new Date(lead.createdAt).toISOString().slice(0, 10);
    if (indexByKey.has(key)) {
      buckets[indexByKey.get(key)].value += 1;
    }
  });

  return buckets.map(({ label, value }) => ({ label, value }));
}

async function getDashboardMetrics(userId) {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);
  const fourteenDaysAgo = new Date(now);
  fourteenDaysAgo.setDate(now.getDate() - 14);
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);

  const [
    totalLeads,
    leadStatusGroups,
    leadTypeGroups,
    leadsLast7Days,
    leadTrendRows,
    totalDossiers,
    dossierStatusGroups,
    unassignedDossiers,
    pendingDocuments,
    paidAggregate,
    revenue30Aggregate,
    pendingPayments,
    managerCount,
    recentLeads,
    recentPaymentsRaw,
    recentNotifications
  ] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.lead.groupBy({ by: ["type"], _count: { _all: true } }),
    prisma.lead.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.lead.findMany({
      where: { createdAt: { gte: fourteenDaysAgo } },
      select: { createdAt: true }
    }),
    prisma.dossier.count(),
    prisma.dossier.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.dossier.count({ where: { advisorId: null, status: { in: activeDossierStatuses } } }),
    prisma.document.count({ where: { status: { in: pendingDocumentStatuses } } }),
    prisma.payment.aggregate({ where: { status: "PAID" }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { status: "PAID", paidAt: { gte: thirtyDaysAgo } }, _sum: { amount: true } }),
    prisma.payment.count({ where: { status: { in: pendingPaymentStatuses } } }),
    prisma.user.count({ where: { role: "MANAGER", status: { not: "SUSPENDED" } } }),
    prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        type: true,
        status: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        createdAt: true
      }
    }),
    prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        label: true,
        amount: true,
        currency: true,
        status: true,
        createdAt: true,
        client: {
          select: {
            firstName: true,
            lastName: true,
            user: { select: { email: true } }
          }
        }
      }
    }),
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 8
    })
  ]);

  const leadsByStatus = Object.fromEntries(leadStatuses.map((status) => [status, 0]));
  leadStatusGroups.forEach((group) => {
    leadsByStatus[group.status] = group._count._all;
  });

  const leadsByType = Object.fromEntries(leadTypes.map((type) => [type, 0]));
  leadTypeGroups.forEach((group) => {
    leadsByType[group.type] = group._count._all;
  });

  const dossiersByStatus = Object.fromEntries(dossierStatuses.map((status) => [status, 0]));
  dossierStatusGroups.forEach((group) => {
    dossiersByStatus[group.status] = group._count._all;
  });

  const activeDossiers = activeDossierStatuses.reduce((total, status) => total + (dossiersByStatus[status] || 0), 0);
  const convertedLeads = leadsByStatus.CONVERTED || 0;
  const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;
  const totalRevenue = paidAggregate._sum.amount || 0;
  const revenueLast30Days = revenue30Aggregate._sum.amount || 0;

  return {
    kpis: {
      totalLeads,
      newLeads: leadsByStatus.NEW || 0,
      leadsLast7Days,
      convertedLeads,
      conversionRate,
      totalDossiers,
      activeDossiers,
      pendingDocuments,
      totalRevenue,
      revenueLast30Days,
      pendingPayments,
      managerCount,
      unassignedDossiers
    },
    leadsByStatus,
    leadsByType,
    dossiersByStatus,
    leadTrend: buildLeadTrend(leadTrendRows),
    recentLeads: recentLeads.map((lead) => ({
      ...lead,
      createdAt: lead.createdAt.toISOString()
    })),
    recentPayments: recentPaymentsRaw.map((payment) => ({
      id: payment.id,
      label: payment.label,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      createdAt: payment.createdAt.toISOString(),
      clientName: getClientName(payment.client)
    })),
    recentNotifications: recentNotifications.map(serializeNotification)
  };
}

function countUnreadNotifications(notifications) {
  return notifications.filter((notification) => notification.status !== "READ" && !notification.readAt).length;
}

function getEmptyDashboardMetrics() {
  return {
    kpis: {
      totalLeads: 0,
      newLeads: 0,
      leadsLast7Days: 0,
      convertedLeads: 0,
      conversionRate: 0,
      totalDossiers: 0,
      activeDossiers: 0,
      pendingDocuments: 0,
      totalRevenue: 0,
      revenueLast30Days: 0,
      pendingPayments: 0,
      managerCount: 0,
      unassignedDossiers: 0
    },
    leadsByStatus: Object.fromEntries(leadStatuses.map((status) => [status, 0])),
    leadsByType: Object.fromEntries(leadTypes.map((type) => [type, 0])),
    dossiersByStatus: Object.fromEntries(dossierStatuses.map((status) => [status, 0])),
    leadTrend: buildLeadTrend([]),
    recentLeads: [],
    recentPayments: [],
    recentNotifications: []
  };
}

async function getDashboardMetricsSafe(userId) {
  try {
    const metrics = await getDashboardMetrics(userId);
    return { metrics, dbUnavailable: false };
  } catch (error) {
    console.error("Admin dashboard metrics loading failed", error);
    return {
      metrics: getEmptyDashboardMetrics(),
      dbUnavailable: true
    };
  }
}

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/connexion?callbackUrl=/admin");
  }

  if (session.user.role === "MANAGER") {
    redirect("/manager");
  }

  if (!adminRoles.includes(session.user.role)) {
    redirect("/espace-client");
  }

  const { metrics, dbUnavailable } = await getDashboardMetricsSafe(session.user.id);
  const unreadNotificationCount = countUnreadNotifications(metrics.recentNotifications);

  return (
    <div className="light-page">
      <SiteHeader light notificationCount={unreadNotificationCount} showNotificationCount hideSiteNav />
      {dbUnavailable && (
        <div className="container" style={{ paddingTop: 20 }}>
          <div className="notice notice-error">
            Connexion à la base de données indisponible. Le tableau de bord est affiché en mode dégradé.
          </div>
        </div>
      )}
      <AdminDashboard metrics={metrics} />
    </div>
  );
}
