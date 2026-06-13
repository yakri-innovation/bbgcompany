import ClientDashboardPage from "@/components/ClientDashboardPage";
import { getClientDashboardOrRedirect } from "@/app/espace-client/_helpers";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "BBG Company - Mes dossiers",
  description: "Suivi des dossiers client BBG Company."
};

export default async function EspaceClientDossiersPage() {
  const dashboard = await getClientDashboardOrRedirect("/espace-client/dossiers");

  return <ClientDashboardPage dashboard={dashboard} view="dossiers" />;
}
