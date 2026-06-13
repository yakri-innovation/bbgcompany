import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { serializeNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

export async function PATCH(_request, { params }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return Response.json({ error: "Authentification requise." }, { status: 401 });
  }

  const notification = await prisma.notification.findUnique({
    where: { id: params.id }
  });

  if (!notification) {
    return Response.json({ error: "Notification introuvable." }, { status: 404 });
  }

  if (notification.userId !== session.user.id) {
    return Response.json({ error: "Accès refusé." }, { status: 403 });
  }

  const updatedNotification = await prisma.notification.update({
    where: { id: notification.id },
    data: {
      status: "READ",
      readAt: notification.readAt || new Date()
    }
  });

  return Response.json({ notification: serializeNotification(updatedNotification) });
}
