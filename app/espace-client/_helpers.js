import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/options";
import { getClientDashboardData } from "@/lib/client-dashboard";

export async function getClientDashboardOrRedirect(callbackUrl) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect(`/connexion?callbackUrl=${callbackUrl}`);
  }

  const dashboard = await getClientDashboardData(session.user.id);

  if (!dashboard) {
    if (["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      redirect("/admin");
    }

    if (session.user.role === "MANAGER") {
      redirect("/manager");
    }

    redirect("/");
  }

  return dashboard;
}
