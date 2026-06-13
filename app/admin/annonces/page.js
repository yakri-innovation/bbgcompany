import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import AdminAnnouncementsPage from "@/components/AdminAnnouncementsPage";
import AdminNav from "@/components/AdminNav";
import SiteHeader from "@/components/SiteHeader";
import { serializeAnnouncement } from "@/lib/announcements";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "BBG Company - Administration des annonces",
  description: "Back-office BBG Company pour publier et archiver les annonces."
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

async function getAnnouncements() {
  const announcements = await prisma.announcement.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }]
  });

  return announcements.map(serializeAnnouncement);
}

export default async function AdminAnnoncesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/connexion?callbackUrl=/admin/annonces");
  }

  if (!adminRoles.includes(session.user.role)) {
    redirect("/espace-client");
  }

  const announcements = await getAnnouncements();
  const unreadNotificationCount = await getUnreadNotificationCount(session.user.id);

  return (
    <div className="light-page">
      <SiteHeader light notificationCount={unreadNotificationCount} showNotificationCount hideSiteNav />
      <div className="container" style={{ paddingTop: 28 }}>
        <AdminNav />
      </div>
      <AdminAnnouncementsPage initialAnnouncements={announcements} />
    </div>
  );
}
