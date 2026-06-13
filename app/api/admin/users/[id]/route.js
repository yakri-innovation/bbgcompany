import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth/options";
import { createUserNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

const adminRoles = ["ADMIN", "SUPER_ADMIN"];
const staffRoles = ["MANAGER", "ADMIN", "SUPER_ADMIN"];
const allowedStatuses = ["ACTIVE", "SUSPENDED"];

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

const staffSelect = {
  id: true,
  email: true,
  role: true,
  status: true,
  createdAt: true,
  lastLoginAt: true,
  _count: { select: { advisedDossiers: true } }
};

export async function PATCH(request, { params }) {
  const session = await requireAdminSession();

  if (!session) {
    return Response.json({ error: "Accès refusé." }, { status: 403 });
  }

  const { id } = params;

  if (id === session.user.id) {
    return Response.json({ error: "Vous ne pouvez pas modifier votre propre compte ici." }, { status: 400 });
  }

  let body;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Requête invalide." }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id }, select: staffSelect });

  if (!target || !staffRoles.includes(target.role)) {
    return Response.json({ error: "Compte introuvable." }, { status: 404 });
  }

  // Only SUPER_ADMIN can modify ADMIN or SUPER_ADMIN accounts.
  if ((target.role === "ADMIN" || target.role === "SUPER_ADMIN") && session.user.role !== "SUPER_ADMIN") {
    return Response.json({ error: "Seul un super administrateur peut modifier ce compte." }, { status: 403 });
  }

  const data = {};
  const auditMetadata = {};

  if (typeof body.status === "string") {
    if (!allowedStatuses.includes(body.status)) {
      return Response.json({ error: "Statut non autorisé." }, { status: 400 });
    }

    data.status = body.status;
    auditMetadata.status = body.status;
  }

  if (typeof body.role === "string" && body.role !== target.role) {
    if (!staffRoles.includes(body.role)) {
      return Response.json({ error: "Rôle non autorisé." }, { status: 400 });
    }

    if ((body.role === "ADMIN" || body.role === "SUPER_ADMIN") && session.user.role !== "SUPER_ADMIN") {
      return Response.json({ error: "Seul un super administrateur peut attribuer ce rôle." }, { status: 403 });
    }

    data.role = body.role;
    auditMetadata.role = body.role;
  }

  let temporaryPassword;

  if (body.resetPassword === true) {
    temporaryPassword = generateTemporaryPassword();
    data.passwordHash = await bcrypt.hash(temporaryPassword, 10);
    auditMetadata.passwordReset = true;
  }

  if (Object.keys(data).length === 0) {
    return Response.json({ error: "Aucune modification fournie." }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: staffSelect
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      entityType: "USER",
      entityId: id,
      action: "STAFF_ACCOUNT_UPDATED",
      metadata: auditMetadata
    }
  });

  if (temporaryPassword) {
    await createUserNotification({
      userId: id,
      recipientEmail: updated.email,
      type: "ACCOUNT_PASSWORD_RESET",
      title: "Votre mot de passe BBG Company a été réinitialisé",
      message: `Nouveau mot de passe temporaire: ${temporaryPassword}`,
      preferEmail: true
    });
  }

  return Response.json({ user: serializeStaff(updated), temporaryPassword });
}
