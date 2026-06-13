import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/options";
import { getManagerDashboardData } from "@/lib/manager-dashboard";

const allowedRoles = ["MANAGER", "ADMIN", "SUPER_ADMIN"];

export async function getManagerDataOrRedirect(callbackUrl) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect(`/connexion?callbackUrl=${callbackUrl}`);
  }

  if (!allowedRoles.includes(session.user.role)) {
    redirect("/espace-client");
  }

  if (["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    redirect("/admin");
  }

  const { dossiers, notifications } = await getManagerDashboardData(session.user.id);

  return {
    session,
    manager: {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
      name: session.user.name || session.user.email
    },
    dossiers,
    notifications
  };
}
