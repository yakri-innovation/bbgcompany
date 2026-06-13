import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import AdminPaymentsPage from "@/components/AdminPaymentsPage";
import AdminNav from "@/components/AdminNav";
import SiteHeader from "@/components/SiteHeader";
import { serializePayment } from "@/lib/payments";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "BBG Company - Administration des paiements",
  description: "Back-office BBG Company pour créer et suivre les paiements clients."
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

function serializePaymentWithRelations(payment) {
  return {
    ...serializePayment(payment),
    dossier: {
      ...payment.dossier,
      createdAt: payment.dossier.createdAt.toISOString(),
      updatedAt: payment.dossier.updatedAt.toISOString(),
      client: {
        id: payment.dossier.client.id,
        firstName: payment.dossier.client.firstName,
        lastName: payment.dossier.client.lastName,
        user: {
          email: payment.dossier.client.user.email
        }
      }
    }
  };
}

function serializeDossierOption(dossier) {
  return {
    id: dossier.id,
    title: dossier.title,
    status: dossier.status,
    type: dossier.type,
    createdAt: dossier.createdAt.toISOString(),
    client: {
      id: dossier.client.id,
      firstName: dossier.client.firstName,
      lastName: dossier.client.lastName,
      user: {
        email: dossier.client.user.email
      }
    }
  };
}

async function getPaymentsPageData() {
  const [payments, dossiers] = await Promise.all([
    prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        dossier: {
          select: {
            id: true,
            title: true,
            status: true,
            type: true,
            createdAt: true,
            updatedAt: true,
            client: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                user: {
                  select: {
                    email: true
                  }
                }
              }
            }
          }
        }
      }
    }),
    prisma.dossier.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            user: {
              select: {
                email: true
              }
            }
          }
        }
      }
    })
  ]);

  return {
    payments: payments.map(serializePaymentWithRelations),
    dossiers: dossiers.map(serializeDossierOption)
  };
}

export default async function AdminPaiementsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/connexion?callbackUrl=/admin/paiements");
  }

  if (!adminRoles.includes(session.user.role)) {
    redirect("/espace-client");
  }

  const { payments, dossiers } = await getPaymentsPageData();
  const unreadNotificationCount = await getUnreadNotificationCount(session.user.id);

  return (
    <div className="light-page">
      <SiteHeader light notificationCount={unreadNotificationCount} showNotificationCount hideSiteNav />
      <div className="container" style={{ paddingTop: 28 }}>
        <AdminNav />
      </div>
      <AdminPaymentsPage initialPayments={payments} dossierOptions={dossiers} />
    </div>
  );
}
