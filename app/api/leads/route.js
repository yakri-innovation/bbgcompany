import { prisma } from "@/lib/prisma";
import { createAdminNotifications } from "@/lib/notifications";

const allowedTypes = ["GESTION_RH", "GESTION_COMPTA", "CREATION", "REPRISE", "ANNONCE", "CONTACT"];

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : undefined;
}

function hasMinimalCreationPayload(payload) {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const companyName = normalizeText(payload.companyName);
  const legalForm = normalizeText(payload.legalForm);
  const shareholders = Array.isArray(payload.shareholders) ? payload.shareholders : [];
  const hasNamedShareholder = shareholders.some((shareholder) => {
    if (!shareholder || typeof shareholder !== "object") {
      return false;
    }

    return Boolean(normalizeText(shareholder.firstName) && normalizeText(shareholder.lastName));
  });

  return Boolean(companyName && legalForm && hasNamedShareholder);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const type = normalizeText(body.type);
    const payload = body.payload && typeof body.payload === "object" ? body.payload : {};

    if (!allowedTypes.includes(type)) {
      return Response.json({ error: "Type de demande invalide." }, { status: 400 });
    }

    if (["CREATION", "REPRISE"].includes(type) && !hasMinimalCreationPayload(payload)) {
      return Response.json({ error: "Le formulaire création/reprise est incomplet." }, { status: 400 });
    }

    const lead = await prisma.lead.create({
      data: {
        type,
        source: normalizeText(body.source),
        firstName: normalizeText(body.firstName),
        lastName: normalizeText(body.lastName),
        email: normalizeText(body.email)?.toLowerCase(),
        phone: normalizeText(body.phone),
        payload
      },
      select: {
        id: true,
        type: true,
        status: true,
        createdAt: true
      }
    });

    await createAdminNotifications({
      dossierId: null,
      type: "NEW_LEAD",
      title: "Nouvelle demande reçue",
      message: `Un nouveau lead ${type} (${lead.id.slice(0, 8)}) vient d'être enregistré.`,
      preferEmail: true
    });

    return Response.json({ lead }, { status: 201 });
  } catch (error) {
    console.error("Lead creation failed", error);
    return Response.json({ error: "Impossible d'enregistrer la demande." }, { status: 500 });
  }
}
