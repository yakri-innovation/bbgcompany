import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth/options";
import { createUserNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

const adminRoles = ["ADMIN", "SUPER_ADMIN"];
const staffRoles = ["MANAGER", "ADMIN", "SUPER_ADMIN"];
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function generateTemporaryPassword() {
  const randomPart = Math.random().toString(36).slice(-8);
  return `BBG-${randomPart}`;
}

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
  });

  return Response.json({ users: users.map(serializeStaff) });
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
  const role = normalizeText(body.role) || "MANAGER";
  const password = typeof body.password === "string" ? body.password : "";

  if (!emailPattern.test(email)) {
    return Response.json({ error: "Adresse e-mail invalide." }, { status: 400 });
  }

  if (!staffRoles.includes(role)) {
    return Response.json({ error: "Rôle non autorisé." }, { status: 400 });
  }

  // Only SUPER_ADMIN can create ADMIN or SUPER_ADMIN accounts.
  if ((role === "ADMIN" || role === "SUPER_ADMIN") && session.user.role !== "SUPER_ADMIN") {
    return Response.json({ error: "Seul un super administrateur peut créer ce type de compte." }, { status: 403 });
  }

  if (password && password.length < 8) {
    return Response.json({ error: "Le mot de passe doit contenir au moins 8 caractères." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    return Response.json({ error: "Un compte existe déjà avec cet e-mail." }, { status: 409 });
  }

  const temporaryPassword = password || generateTemporaryPassword();
  const passwordHash = await bcrypt.hash(temporaryPassword, 10);

  const user = await prisma.user.create({
    data: {
      email,
      role,
      status: "ACTIVE",
      passwordHash
    },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      lastLoginAt: true,
      _count: { select: { advisedDossiers: true } }
    }
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      entityType: "USER",
      entityId: user.id,
      action: "STAFF_ACCOUNT_CREATED",
      metadata: { email, role }
    }
  });

  await createUserNotification({
    userId: user.id,
    recipientEmail: user.email,
    type: "ACCOUNT_CREATED",
    title: "Votre compte BBG Company est prêt",
    message: `Un compte ${role} a été créé pour vous. Mot de passe temporaire: ${temporaryPassword}`,
    preferEmail: true
  });

  return Response.json(
    {
      user: serializeStaff(user),
      temporaryPassword: password ? undefined : temporaryPassword
    },
    { status: 201 }
  );
}
