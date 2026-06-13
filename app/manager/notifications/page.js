import ManagerDashboardPage from "@/components/ManagerDashboardPage";
import SiteHeader from "@/components/SiteHeader";
import { countManagerUnreadNotifications } from "@/lib/manager-dashboard";
import { getManagerDataOrRedirect } from "@/app/manager/_helpers";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "BBG Company - Notifications manager",
  description: "Notifications manager pour le suivi opérationnel des dossiers."
};

export default async function ManagerNotificationsPage() {
  const { manager, dossiers, notifications } = await getManagerDataOrRedirect("/manager/notifications");
  const unreadNotificationCount = countManagerUnreadNotifications(notifications);

  return (
    <div className="light-page">
      <SiteHeader
        light
        notificationCount={unreadNotificationCount}
        showNotificationCount
        hideSiteNav
        notificationHref="/manager/notifications"
      />
      <ManagerDashboardPage
        manager={manager}
        initialDossiers={dossiers}
        initialNotifications={notifications}
        view="notifications"
      />
    </div>
  );
}
