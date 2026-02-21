// src/lib/push-service.ts
import webpush from 'web-push';
import connectDB from '@/lib/mongodb';
import PushSubscription from '@/models/PushSubscription';
import User from '@/models/User';

// Configure VAPID credentials once at module load
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
}

/**
 * Send a push notification to all active subscriptions of the conserje user.
 * Automatically removes subscriptions that have expired (HTTP 410/404 from push relay).
 * Never throws — push failures are logged silently so booking routes are never affected.
 */
export async function sendPushToConserje(payload: PushPayload): Promise<void> {
  try {
    await connectDB();

    // Find the single conserje user
    const conserje = await User.findOne({ role: 'conserje' }).select('_id');
    if (!conserje) {
      console.warn('[push-service] No conserje user found in DB');
      return;
    }

    // Find all push subscriptions for that user (supports multi-device)
    const subscriptions = await PushSubscription.find({
      userId: conserje._id.toString(),
    });

    if (subscriptions.length === 0) {
      console.log('[push-service] Conserje has no active push subscriptions');
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
          await webpush.sendNotification(pushSub, payloadString);
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
