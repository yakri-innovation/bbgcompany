import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { createAdminNotifications, createUserNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { serializePayment } from "@/lib/payments";

const adminRoles = ["ADMIN", "SUPER_ADMIN"];

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function parseAmountToCents(value) {
  const normalized = typeof value === "number" ? String(value) : normalizeText(value).replace(",", ".");
  const numericValue = Number(normalized);

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return null;
  }

  return Math.round(numericValue * 100);
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

  return Response.json({
    payments: payments.map(serializePaymentWithRelations),
    dossiers: dossiers.map(serializeDossierOption)
  });
}

export async function POST(request) {
  const session = await requireAdminSession();

  if (!session) {
    return Response.json({ error: "Accès refusé." }, { status: 403 });
  }

  const body = await request.json();
  const dossierId = normalizeText(body.dossierId);
  const label = normalizeText(body.label);
  const amount = parseAmountToCents(body.amount);
  const currency = normalizeText(body.currency || "EUR").toUpperCase() || "EUR";

  if (!dossierId || !label || !amount) {
    return Response.json({ error: "Dossier, libellé et montant valides sont obligatoires." }, { status: 400 });
  }

  const dossier = await prisma.dossier.findUnique({
    where: { id: dossierId },
    include: {
      client: {
        include: {
          user: {
            select: {
              email: true
            }
          }
        }
      }
    }
  });

  if (!dossier) {
    return Response.json({ error: "Dossier introuvable." }, { status: 404 });
  }

  const payment = await prisma.payment.create({
    data: {
      dossierId: dossier.id,
      clientId: dossier.clientId,
      label,
      amount,
      currency,
      status: "REQUESTED"
    },
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
  });

  await prisma.dossier.update({
    where: { id: dossier.id },
    data: {
      status: "PAYMENT_REQUESTED"
    }
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      entityType: "Payment",
      entityId: payment.id,
      action: "CREATE_REQUEST",
      metadata: {
        dossierId: dossier.id,
        amount,
        currency
      }
    }
  });

  await createUserNotification({
    userId: dossier.client.userId,
    recipientEmail: dossier.client.user.email,
    dossierId: dossier.id,
    type: "PAYMENT_REQUESTED",
    title: "Nouveau paiement demandé",
    message: `${label} (${(amount / 100).toFixed(2)} ${currency}) est disponible dans votre espace client.`,
    preferEmail: true
  });

  await createAdminNotifications({
    dossierId: dossier.id,
    type: "PAYMENT_REQUEST_CREATED",
    title: "Demande de paiement créée",
    message: `Un paiement ${label} a été demandé pour le dossier ${dossier.title}.`,
    preferEmail: true
  });

  return Response.json({ payment: serializePaymentWithRelations(payment) }, { status: 201 });
}
