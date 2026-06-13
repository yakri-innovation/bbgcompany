import ClientDashboardPage from "@/components/ClientDashboardPage";
import { getClientDashboardOrRedirect } from "@/app/espace-client/_helpers";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "BBG Company - Espace client",
  description: "Tableau de bord client BBG Company pour suivre les démarches, documents et paiements."
};

export default async function EspaceClientPage() {
  const dashboard = await getClientDashboardOrRedirect("/espace-client");

  return <ClientDashboardPage dashboard={dashboard} view="dashboard" />;
}
