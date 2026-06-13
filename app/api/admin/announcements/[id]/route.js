import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { serializeAnnouncement } from "@/lib/announcements";
import { prisma } from "@/lib/prisma";

const adminRoles = ["ADMIN", "SUPER_ADMIN"];
const allowedCategories = ["COMMERCIAL_COMPANY", "BUSINESS_ASSET", "REAL_ESTATE_COMPANY"];
const allowedStatuses = ["DRAFT", "PUBLISHED", "ARCHIVED"];

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

async function requireAdminSession() {
  const session = await getServerSession(authOptions);

  if (!session?.user || !adminRoles.includes(session.user.role)) {
    return null;
  }

  return session;
}

export async function PATCH(request, { params }) {
  const session = await requireAdminSession();

  if (!session) {
    return Response.json({ error: "Accès refusé." }, { status: 403 });
  }

  const currentAnnouncement = await prisma.announcement.findUnique({
    where: { id: params.id }
  });

  if (!currentAnnouncement) {
    return Response.json({ error: "Annonce introuvable." }, { status: 404 });
  }

  const body = await request.json();
  const data = {};

  if (body.title !== undefined) {
    const title = normalizeText(body.title);

    if (!title) {
      return Response.json({ error: "Le titre est obligatoire." }, { status: 400 });
    }

    data.title = title;
  }

  if (body.category !== undefined) {
    const category = normalizeText(body.category);

    if (!allowedCategories.includes(category)) {
      return Response.json({ error: "Catégorie invalide." }, { status: 400 });
    }

    data.category = category;
  }

  if (body.status !== undefined) {
    const status = normalizeText(body.status);

    if (!allowedStatuses.includes(status)) {
      return Response.json({ error: "Statut invalide." }, { status: 400 });
    }

    data.status = status;
    data.publishedAt = status === "PUBLISHED" && !currentAnnouncement.publishedAt ? new Date() : currentAnnouncement.publishedAt;
  }

  if (body.city !== undefined) {
    data.city = normalizeText(body.city) || null;
  }

  if (body.price !== undefined) {
    data.price = normalizeText(body.price) || null;
  }

  if (body.priceBand !== undefined) {
    data.priceBand = normalizeText(body.priceBand) || null;
  }

  if (body.description !== undefined) {
    const description = normalizeText(body.description);

    if (!description) {
      return Response.json({ error: "La description est obligatoire." }, { status: 400 });
    }

    data.description = description;
  }

  if (body.details !== undefined) {
    data.details = body.details && typeof body.details === "object" ? body.details : {};
  }

  const announcement = await prisma.announcement.update({
    where: { id: params.id },
    data
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      entityType: "Announcement",
      entityId: announcement.id,
      action: "UPDATE",
      metadata: data
    }
  });

  return Response.json({ announcement: serializeAnnouncement(announcement) });
}
