import ClientDashboardPage from "@/components/ClientDashboardPage";
import { getClientDashboardOrRedirect } from "@/app/espace-client/_helpers";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "BBG Company - Mon profil",
  description: "Informations de profil dans votre espace client BBG Company."
};

export default async function EspaceClientProfilPage() {
  const dashboard = await getClientDashboardOrRedirect("/espace-client/profil");

  return <ClientDashboardPage dashboard={dashboard} view="profil" />;
}
