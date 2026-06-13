import ClientDashboardPage from "@/components/ClientDashboardPage";
import { getClientDashboardOrRedirect } from "@/app/espace-client/_helpers";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "BBG Company - Mes paiements",
  description: "Paiements et règlements liés à vos dossiers BBG Company."
};

export default async function EspaceClientPaiementsPage() {
  const dashboard = await getClientDashboardOrRedirect("/espace-client/paiements");

  return <ClientDashboardPage dashboard={dashboard} view="paiements" />;
}
