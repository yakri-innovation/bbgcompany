const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function ensureUser({ email, password, role, firstName, lastName, phone, companyName }) {
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role,
      status: "ACTIVE"
    },
    create: {
      email,
      passwordHash,
      role,
      status: "ACTIVE"
    },
    include: { clientProfile: true }
  });

  if (role !== "CLIENT") {
    return user;
  }

  const clientProfile = await prisma.clientProfile.upsert({
    where: { userId: user.id },
    update: {
      firstName,
      lastName,
      phone,
      companyName,
      preferredContactMethod: "Mail"
    },
    create: {
      userId: user.id,
      firstName,
      lastName,
      phone,
      companyName,
      preferredContactMethod: "Mail"
    }
  });

  return { ...user, clientProfile };
}

async function ensureDossier({ clientProfile, advisor }) {
  const title = "Création — CARWASH";
  let dossier = await prisma.dossier.findFirst({
    where: {
      clientId: clientProfile.id,
      title
    }
  });

  if (!dossier) {
    dossier = await prisma.dossier.create({
      data: {
        clientId: clientProfile.id,
        advisorId: advisor.id,
        type: "CREATION",
        title,
        status: "IN_PROGRESS",
        currentStep: 2
      }
    });
  } else {
    dossier = await prisma.dossier.update({
      where: { id: dossier.id },
      data: {
        advisorId: advisor.id,
        status: "IN_PROGRESS",
        currentStep: 2
      }
    });
  }

  const steps = [
    { order: 1, title: "Projet et informations", description: "Choix du projet, nom et forme juridique", status: "COMPLETED" },
    { order: 2, title: "Actionnaires et dirigeants", description: "Informations des associés en cours de traitement", status: "ACTIVE" },
    { order: 3, title: "Documents", description: "Dépôt et validation des pièces justificatives", status: "PENDING" },
    { order: 4, title: "Finalisation", description: "Immatriculation et documents définitifs", status: "PENDING" }
  ];

  for (const step of steps) {
    await prisma.dossierStep.upsert({
      where: {
        dossierId_order: {
          dossierId: dossier.id,
          order: step.order
        }
      },
      update: step,
      create: {
        dossierId: dossier.id,
        ...step
      }
    });
  }

  return dossier;
}

async function ensureDocument({ dossier, clientProfile, type, title, status, fileName }) {
  const existingDocument = await prisma.document.findFirst({
    where: {
      dossierId: dossier.id,
      clientId: clientProfile.id,
      type,
      title
    }
  });

  const data = {
    dossierId: dossier.id,
    clientId: clientProfile.id,
    type,
    title,
    status,
    fileName: fileName || null,
    fileKey: fileName ? `demo/${fileName}` : null,
    mimeType: fileName ? "application/pdf" : null,
    size: fileName ? 128000 : null
  };

  if (!existingDocument) {
    return prisma.document.create({ data });
  }

  return prisma.document.update({
    where: { id: existingDocument.id },
    data
  });
}

async function ensurePayment({ dossier, clientProfile, label, amount, status, paidAt }) {
  const existingPayment = await prisma.payment.findFirst({
    where: {
      dossierId: dossier.id,
      clientId: clientProfile.id,
      label
    }
  });

  const data = {
    dossierId: dossier.id,
    clientId: clientProfile.id,
    label,
    amount,
    currency: "EUR",
    status,
    provider: "manual",
    invoiceUrl: status === "PAID" ? "/factures/demo-creation.pdf" : null,
    paidAt: paidAt || null
  };

  if (!existingPayment) {
    return prisma.payment.create({ data });
  }

  return prisma.payment.update({
    where: { id: existingPayment.id },
    data
  });
}

async function main() {
  const client = await ensureUser({
    email: process.env.SEED_CLIENT_EMAIL || "client@bbg-company.fr",
    password: process.env.SEED_CLIENT_PASSWORD || "Client123!",
    role: "CLIENT",
    firstName: "Sarah",
    lastName: "Diallo",
    phone: "06 11 22 33 44",
    companyName: "CARWASH"
  });

  const advisor = await ensureUser({
    email: process.env.SEED_ADMIN_EMAIL || "admin@bbg-company.fr",
    password: process.env.SEED_ADMIN_PASSWORD || "Admin123!",
    role: "ADMIN",
    firstName: "Admin",
    lastName: "BBG"
  });

  await ensureUser({
    email: process.env.SEED_MANAGER_EMAIL || "manager@bbg-company.fr",
    password: process.env.SEED_MANAGER_PASSWORD || "Manager123!",
    role: "MANAGER",
    firstName: "Manager",
    lastName: "BBG"
  });

  const dossier = await ensureDossier({ clientProfile: client.clientProfile, advisor });

  await ensureDocument({ dossier, clientProfile: client.clientProfile, type: "IDENTITY", title: "Pièce d'identité", status: "REQUESTED" });
  await ensureDocument({ dossier, clientProfile: client.clientProfile, type: "PROOF_OF_ADDRESS", title: "Justificatif de domicile", status: "REQUESTED" });
  await ensureDocument({ dossier, clientProfile: client.clientProfile, type: "STATUTES", title: "Statuts & mandats", status: "AVAILABLE", fileName: "statuts-carwash.pdf" });

  await ensurePayment({ dossier, clientProfile: client.clientProfile, label: "Accompagnement création", amount: 120000, status: "PAID", paidAt: new Date() });
  await ensurePayment({ dossier, clientProfile: client.clientProfile, label: "Partenaire domiciliation", amount: 9900, status: "REQUESTED" });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
