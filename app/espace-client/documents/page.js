import ClientDashboardPage from "@/components/ClientDashboardPage";
import { getClientDashboardOrRedirect } from "@/app/espace-client/_helpers";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "BBG Company - Mes documents",
  description: "Documents demandés et dépôt sécurisé client BBG Company."
};

export default async function EspaceClientDocumentsPage() {
  const dashboard = await getClientDashboardOrRedirect("/espace-client/documents");

  return <ClientDashboardPage dashboard={dashboard} view="documents" />;
}
