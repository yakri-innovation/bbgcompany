import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import AdminDocumentsPage from "@/components/AdminDocumentsPage";
import AdminNav from "@/components/AdminNav";
import SiteHeader from "@/components/SiteHeader";
import { serializeDocument } from "@/lib/documents";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "BBG Company - Administration des documents",
  description: "Back-office BBG Company pour demander, vérifier et valider les documents clients."
};

const adminRoles = ["ADMIN", "SUPER_ADMIN"];

async function getUnreadNotificationCount(userId) {
  return prisma.notification.count({
    where: {
      userId,
      readAt: null,
      status: {
        not: "READ"
      }
    }
  });
}

function serializeDocumentWithRelations(document) {
  return {
    ...serializeDocument(document),
    dossier: document.dossier,
    client: document.client,
    uploadedBy: document.uploadedBy,
    validatedBy: document.validatedBy
  };
}

function serializeDossierOption(dossier) {
  return {
    id: dossier.id,
    title: dossier.title,
    status: dossier.status,
    client: dossier.client
  };
}

async function getDocumentsPageData() {
  const [documents, dossiers] = await Promise.all([
    prisma.document.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        dossier: {
          select: {
            id: true,
            title: true,
            status: true
          }
        },
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            user: {
              select: {
                id: true,
                email: true
              }
            }
          }
        },
        uploadedBy: {
          select: {
            id: true,
            email: true
          }
        },
        validatedBy: {
          select: {
            id: true,
            email: true
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

  return {
    documents: documents.map(serializeDocumentWithRelations),
    dossiers: dossiers.map(serializeDossierOption)
  };
}

export default async function AdminDocumentsPageRoute() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/connexion?callbackUrl=/admin/documents");
  }

  if (!adminRoles.includes(session.user.role)) {
    redirect("/espace-client");
  }

  const { documents, dossiers } = await getDocumentsPageData();
  const unreadNotificationCount = await getUnreadNotificationCount(session.user.id);

  return (
    <div className="light-page">
      <SiteHeader light notificationCount={unreadNotificationCount} showNotificationCount hideSiteNav />
      <div className="container" style={{ paddingTop: 28 }}>
        <AdminNav />
      </div>
      <AdminDocumentsPage initialDocuments={documents} dossierOptions={dossiers} />
    </div>
  );
}
