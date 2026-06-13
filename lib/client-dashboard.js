import { serializeNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

function serializeDashboard(user) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    profile: {
      ...user.clientProfile,
      createdAt: user.clientProfile.createdAt.toISOString(),
      updatedAt: user.clientProfile.updatedAt.toISOString()
    },
    notifications: user.notifications.map(serializeNotification),
    dossiers: user.clientProfile.dossiers.map((dossier) => ({
      ...dossier,
      createdAt: dossier.createdAt.toISOString(),
      updatedAt: dossier.updatedAt.toISOString(),
      closedAt: dossier.closedAt ? dossier.closedAt.toISOString() : null,
      steps: dossier.steps.map((step) => ({
        ...step,
        dueDate: step.dueDate ? step.dueDate.toISOString() : null,
        completedAt: step.completedAt ? step.completedAt.toISOString() : null
      })),
      documents: dossier.documents.map((document) => ({
        ...document,
        createdAt: document.createdAt.toISOString(),
        updatedAt: document.updatedAt.toISOString()
      })),
      payments: dossier.payments.map((payment) => ({
        ...payment,
        createdAt: payment.createdAt.toISOString(),
        paidAt: payment.paidAt ? payment.paidAt.toISOString() : null
      })),
      advisor: dossier.advisor
    }))
  };
}

export async function getClientDashboardData(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      notifications: {
        orderBy: { createdAt: "desc" },
        take: 8
      },
      clientProfile: {
        include: {
          dossiers: {
            orderBy: { createdAt: "desc" },
            include: {
              advisor: {
                select: {
                  id: true,
                  email: true,
                  role: true
                }
              },
              steps: {
                orderBy: { order: "asc" }
              },
              documents: {
                orderBy: { createdAt: "desc" }
              },
              payments: {
                orderBy: { createdAt: "desc" }
              }
            }
          }
        }
      }
    }
  });

  if (!user?.clientProfile) {
    return null;
  }

  return serializeDashboard(user);
}
