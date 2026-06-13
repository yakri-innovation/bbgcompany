import ClientDashboardPage from "@/components/ClientDashboardPage";
import { getClientDashboardOrRedirect } from "@/app/espace-client/_helpers";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "BBG Company - Mes notifications",
  description: "Notifications et alertes de votre espace client BBG Company."
};

export default async function EspaceClientNotificationsPage() {
  const dashboard = await getClientDashboardOrRedirect("/espace-client/notifications");

  return <ClientDashboardPage dashboard={dashboard} view="notifications" />;
}
