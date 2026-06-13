import ManagerDashboardPage from "@/components/ManagerDashboardPage";
import SiteHeader from "@/components/SiteHeader";
import { countManagerUnreadNotifications } from "@/lib/manager-dashboard";
import { getManagerDataOrRedirect } from "@/app/manager/_helpers";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "BBG Company - Espace manager",
  description: "Espace manager BBG Company pour piloter les dossiers clients affectés."
};

export default async function ManagerPage() {
  const { manager, dossiers, notifications } = await getManagerDataOrRedirect("/manager");
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
        view="dashboard"
      />
    </div>
  );
}
