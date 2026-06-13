import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { authOptions } from "@/lib/auth/options";
import { createUserNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

const adminRoles = ["ADMIN", "SUPER_ADMIN"];
const allowedStatuses = ["ACTIVE", "SUSPENDED"];

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

const clientSelect = {
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
};

export async function PATCH(request, { params }) {
  const session = await requireAdminSession();

  if (!session) {
    return Response.json({ error: "Accès refusé." }, { status: 403 });
  }

  const { id } = params;

  let body;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Requête invalide." }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id }, select: clientSelect });

  if (!target || target.role !== "CLIENT") {
    return Response.json({ error: "Client introuvable." }, { status: 404 });
  }

  const userData = {};
  const profileData = {};
  const auditMetadata = {};

  if (typeof body.status === "string") {
    if (!allowedStatuses.includes(body.status)) {
      return Response.json({ error: "Statut non autorisé." }, { status: 400 });
    }

    userData.status = body.status;
    auditMetadata.status = body.status;
  }

  if (typeof body.firstName === "string") {
    profileData.firstName = normalizeText(body.firstName);
  }

  if (typeof body.lastName === "string") {
    profileData.lastName = normalizeText(body.lastName);
  }

  if (typeof body.phone === "string") {
    profileData.phone = normalizeText(body.phone) || null;
  }

  if (typeof body.companyName === "string") {
    profileData.companyName = normalizeText(body.companyName) || null;
  }

  let temporaryPassword;

  if (body.resetPassword === true) {
    temporaryPassword = generateTemporaryPassword();
    userData.passwordHash = await bcrypt.hash(temporaryPassword, 10);
    auditMetadata.passwordReset = true;
  }

  if (Object.keys(profileData).length > 0 && target.clientProfile) {
    userData.clientProfile = { update: profileData };
    auditMetadata.profileUpdated = true;
  }

  if (Object.keys(userData).length === 0) {
    return Response.json({ error: "Aucune modification fournie." }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id },
    data: userData,
    select: clientSelect
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      entityType: "USER",
      entityId: id,
      action: "CLIENT_ACCOUNT_UPDATED",
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

  return Response.json({ client: serializeClient(updated), temporaryPassword });
}
