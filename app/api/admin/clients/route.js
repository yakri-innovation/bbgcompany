import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth/options";
import { createUserNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

const adminRoles = ["ADMIN", "SUPER_ADMIN"];
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function generateTemporaryPassword() {
  const randomPart = Math.random().toString(36).slice(-8);
  return `BBG-${randomPart}`;
}

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

  const users = await prisma.user.findMany({
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
  });

  return Response.json({ clients: users.map(serializeClient) });
}

export async function POST(request) {
  const session = await requireAdminSession();

  if (!session) {
    return Response.json({ error: "Accès refusé." }, { status: 403 });
  }

  let body;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Requête invalide." }, { status: 400 });
  }

  const email = normalizeText(body.email).toLowerCase();
  const firstName = normalizeText(body.firstName);
  const lastName = normalizeText(body.lastName);
  const phone = normalizeText(body.phone);
  const companyName = normalizeText(body.companyName);

  if (!emailPattern.test(email)) {
    return Response.json({ error: "Adresse e-mail invalide." }, { status: 400 });
  }

  if (!firstName || !lastName) {
    return Response.json({ error: "Le prénom et le nom sont obligatoires." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    return Response.json({ error: "Un compte existe déjà avec cet e-mail." }, { status: 409 });
  }

  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await bcrypt.hash(temporaryPassword, 10);

  const user = await prisma.user.create({
    data: {
      email,
      role: "CLIENT",
      status: "ACTIVE",
      passwordHash,
      clientProfile: {
        create: {
          firstName,
          lastName,
          phone: phone || null,
          companyName: companyName || null
        }
      }
    },
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
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      entityType: "USER",
      entityId: user.id,
      action: "CLIENT_ACCOUNT_CREATED",
      metadata: { email }
    }
  });

  await createUserNotification({
    userId: user.id,
    recipientEmail: user.email,
    type: "ACCOUNT_CREATED",
    title: "Bienvenue chez BBG Company",
    message: `Votre espace client a été créé. Mot de passe temporaire: ${temporaryPassword}`,
    preferEmail: true
  });

  return Response.json({ client: serializeClient(user), temporaryPassword }, { status: 201 });
}
