import { prisma } from "@/lib/prisma";

const adminRoles = ["ADMIN", "SUPER_ADMIN"];
const emailWebhookUrl = process.env.NOTIFICATION_EMAIL_WEBHOOK_URL;
const emailWebhookSecret = process.env.NOTIFICATION_EMAIL_WEBHOOK_SECRET;

export const notificationStatusLabels = {
  PENDING: "En attente",
  SENT: "Envoyée",
  FAILED: "Échouée",
  READ: "Lue"
};

export function serializeNotification(notification) {
  return {
    ...notification,
    createdAt: notification.createdAt.toISOString(),
    readAt: notification.readAt ? notification.readAt.toISOString() : null
  };
}

async function sendNotificationEmail({ to, title, message }) {
  if (!to || !emailWebhookUrl) {
    return false;
  }

  try {
    const response = await fetch(emailWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(emailWebhookSecret ? { "x-notification-secret": emailWebhookSecret } : {})
      },
      body: JSON.stringify({
        to,
        subject: title,
        text: message
      })
    });

    return response.ok;
  } catch (error) {
    console.error("Notification email delivery failed", error);
    return false;
  }
}

export async function createUserNotification({
  userId,
  recipientEmail,
  dossierId,
  type,
  title,
  message,
  preferEmail = false,
  channel = "APP",
  status = "SENT",
  db = prisma
}) {
  if (!userId || !type || !title || !message) {
    return null;
  }

  if (preferEmail) {
    const isEmailDelivered = await sendNotificationEmail({
      to: recipientEmail,
      title,
      message
    });

    if (isEmailDelivered) {
      return db.notification.create({
        data: {
          userId,
          dossierId: dossierId || null,
          type,
          title,
          message,
          channel: "EMAIL",
          status: "SENT"
        }
      });
    }
  }

  return db.notification.create({
    data: {
      userId,
      dossierId: dossierId || null,
      type,
      title,
      message,
      channel,
      status
    }
  });
}

export async function createAdminNotifications({
  dossierId,
  type,
  title,
  message,
  preferEmail = false,
  channel = "APP",
  status = "SENT",
  db = prisma
}) {
  if (!type || !title || !message) {
    return 0;
  }

  const admins = await db.user.findMany({
    where: {
      role: {
        in: adminRoles
      },
      status: "ACTIVE"
    },
    select: {
      id: true,
      email: true
    }
  });

  if (admins.length === 0) {
    return 0;
  }

  const results = await Promise.all(
    admins.map((admin) =>
      createUserNotification({
        db,
        userId: admin.id,
        recipientEmail: admin.email,
        dossierId,
        type,
        title,
        message,
        preferEmail,
        channel,
        status
      })
    )
  );

  return results.filter(Boolean).length;
}
