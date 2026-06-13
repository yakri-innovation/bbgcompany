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

function slugify(value) {
  return normalizeText(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function requireAdminSession() {
  const session = await getServerSession(authOptions);

  if (!session?.user || !adminRoles.includes(session.user.role)) {
    return null;
  }

  return session;
}

async function createUniqueSlug(title) {
  const baseSlug = slugify(title) || "annonce";
  let slug = baseSlug;
  let suffix = 1;

  while (await prisma.announcement.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  return slug;
}

export async function GET() {
  const session = await requireAdminSession();

  if (!session) {
    return Response.json({ error: "Accès refusé." }, { status: 403 });
  }

  const announcements = await prisma.announcement.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }]
  });

  return Response.json({ announcements: announcements.map(serializeAnnouncement) });
}

export async function POST(request) {
  const session = await requireAdminSession();

  if (!session) {
    return Response.json({ error: "Accès refusé." }, { status: 403 });
  }

  const body = await request.json();
  const title = normalizeText(body.title);
  const category = normalizeText(body.category);
  const status = normalizeText(body.status) || "DRAFT";
  const description = normalizeText(body.description);

  if (!title || !description || !allowedCategories.includes(category) || !allowedStatuses.includes(status)) {
    return Response.json({ error: "Titre, catégorie, description et statut valides sont obligatoires." }, { status: 400 });
  }

  const announcement = await prisma.announcement.create({
    data: {
      title,
      slug: await createUniqueSlug(title),
      category,
      city: normalizeText(body.city) || null,
      price: normalizeText(body.price) || null,
      priceBand: normalizeText(body.priceBand) || null,
      description,
      details: body.details && typeof body.details === "object" ? body.details : {},
      status,
      publishedAt: status === "PUBLISHED" ? new Date() : null
    }
  });

  await prisma.auditLog.create({
    data: {
      actorId: session.user.id,
      entityType: "Announcement",
      entityId: announcement.id,
      action: "CREATE",
      metadata: { status: announcement.status }
    }
  });

  return Response.json({ announcement: serializeAnnouncement(announcement) }, { status: 201 });
}
