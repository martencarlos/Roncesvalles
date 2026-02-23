// src/lib/push-service.ts
import webpush from 'web-push';
import connectDB from '@/lib/mongodb';
import PushSubscription from '@/models/PushSubscription';
import User from '@/models/User';
import NotificationLog from '@/models/NotificationLog';

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
}

/**
 * Send a push notification to all active subscriptions of all conserje users.
 * Automatically removes subscriptions that have expired (HTTP 410/404 from push relay).
 * Never throws — push failures are logged silently so booking routes are never affected.
 */
export async function sendPushToConserje(payload: PushPayload): Promise<void> {
  try {
    // Guard: skip if VAPID env vars are not configured
    if (!process.env.VAPID_SUBJECT || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
      console.warn('[push-service] VAPID env vars not configured, skipping push');
      return;
    }

    // Initialize VAPID credentials lazily (inside the function, not at module load)
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT,
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );

    await connectDB();

    // Persist notification to history (always, regardless of subscription state)
    await NotificationLog.create({
      title: payload.title,
      body: payload.body,
      tag: payload.tag,
    });

    // Find all conserje users
    const conserjes = await User.find({ role: 'conserje' }).select('_id');
    if (conserjes.length === 0) {
      console.warn('[push-service] No conserje users found in DB');
      return;
    }

    const conserjeIds = conserjes.map((c: any) => c._id.toString());

    // Find all push subscriptions for all conserje users (supports multiple users + multi-device)
    const subscriptions = await PushSubscription.find({
      userId: { $in: conserjeIds },
    });

    if (subscriptions.length === 0) {
      console.log('[push-service] No active push subscriptions for conserje users');
      return;
    }

    const payloadString = JSON.stringify(payload);

    // Send to each subscription in parallel; don't abort if one fails
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        const pushSub = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.keys.p256dh,
            auth: sub.keys.auth,
          },
        };

        try {
          await webpush.sendNotification(pushSub, payloadString, {
            urgency: 'high',
            TTL: 86400, // 24 hours — gives Android time to wake up and deliver
          });
        } catch (err: any) {
          // 410 Gone or 404 Not Found = subscription expired/unsubscribed
          if (err.statusCode === 410 || err.statusCode === 404) {
            console.log(`[push-service] Removing stale subscription: ${sub.endpoint}`);
            await PushSubscription.findByIdAndDelete(sub._id);
          } else {
            throw err;
          }
        }
      })
    );

    // Log unexpected failures without crashing
    results.forEach((result, idx) => {
      if (result.status === 'rejected') {
        console.error(`[push-service] Failed for subscription ${idx}:`, result.reason);
      }
    });
  } catch (error) {
    // Never throw from here — push failures must not break booking creation/update
    console.error('[push-service] Unexpected error in sendPushToConserje:', error);
  }
}
