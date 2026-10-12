// One entry point for telling a user something happened.
// Always records an in-app notification; optionally sends email and push.
// Delivery failures are logged and never fail the action that triggered them.

import type { NotificationType } from "@prisma/client";
import { sendPushNotification } from "../lib/firebase.js";
import { notificationEmail, sendEmailSafely, webUrl } from "../lib/mailer.js";
import { prisma } from "../lib/prisma.js";

export interface NotifyInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  /** Web path the notification opens, e.g. /messages/abc. Also sent to mobile. */
  link?: string;
  data?: Record<string, string>;
  /** Send an email as well — reserve for events that need action or involve money. */
  email?: boolean;
  /** Label for the email's button. */
  actionLabel?: string;
}

export async function notify(input: NotifyInput): Promise<void> {
  const data = { ...(input.data ?? {}), ...(input.link ? { link: input.link } : {}) };
  try {
    await prisma.notification.create({
      data: { userId: input.userId, type: input.type, title: input.title, body: input.body, data },
    });
  } catch (error) {
    console.error("Notification could not be saved:", error);
    return;
  }

  const user = await prisma.user
    .findUnique({ where: { id: input.userId }, select: { email: true, firstName: true, fcmTokens: true } })
    .catch(() => null);
  if (!user) return;

  const deliveries: Promise<unknown>[] = [];
  if (user.fcmTokens.length) {
    deliveries.push(
      sendPushNotification({ tokens: user.fcmTokens, title: input.title, body: input.body, data }).catch((error) =>
        console.error("Push failed:", error),
      ),
    );
  }
  if (input.email) {
    const action = input.link ? { label: input.actionLabel ?? "Open Lettr", url: webUrl(input.link) } : undefined;
    deliveries.push(sendEmailSafely({ to: user.email, ...notificationEmail(user.firstName, input.title, input.body, action) }));
  }
  await Promise.all(deliveries);
}

/** Fire-and-forget variant for code paths that must not wait on delivery. */
export function notifyLater(input: NotifyInput): void {
  void notify(input);
}
