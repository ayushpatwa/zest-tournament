import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { saveDeviceTokenRealtime } from './firebase';
import { sendToMakeWebhook } from './webhookService';

let pushInitialized = false;

/**
 * Initialize Push Notifications & Android Notification Channels
 * Requests permission, registers with Google FCM, and stores device token in Firestore
 */
export const initPushNotifications = async (currentUser, onNotificationAction) => {
  if (pushInitialized) return;

  const isNative = Capacitor.isNativePlatform();
  console.log(`[PushNotifications] Initializing on platform: ${Capacitor.getPlatform()} (isNative: ${isNative})`);

  if (!isNative) {
    console.log('[PushNotifications] Web platform detected. Browser notifications will be handled via Web Notification API.');
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        await Notification.requestPermission();
      } catch (_) {}
    }
    return;
  }

  try {
    pushInitialized = true;

    // 1. Create Android Notification Channels (Required for Android 8.0+ / API 26+)
    try {
      await PushNotifications.createChannel({
        id: 'zest_alerts',
        name: 'Zest Match Alerts & Room Drops',
        description: 'Instant alerts for Room ID drops, match reminders, and tournament announcements',
        importance: 5, // High importance (heads-up notification + sound)
        visibility: 1, // Public on lockscreen
        sound: 'default',
        vibration: true,
        lights: true,
        lightColor: '#ff2a5f'
      });
      console.log('[PushNotifications] Notification channel "zest_alerts" created successfully.');
    } catch (channelErr) {
      console.warn('[PushNotifications] Notification channel creation warning:', channelErr);
    }

    // 2. Check & Request Permissions (Includes Android 13+ POST_NOTIFICATIONS)
    let permStatus = await PushNotifications.checkPermissions();
    if (permStatus.receive === 'prompt' || permStatus.receive === 'prompt-with-rationale') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      console.warn('[PushNotifications] Permission not granted by user:', permStatus.receive);
      return;
    }

    // 3. Register device with FCM
    await PushNotifications.register();

    // 4. Listeners: Registration success (FCM Token received)
    await PushNotifications.addListener('registration', async (token) => {
      console.log('[PushNotifications] FCM Device Token received:', token.value);
      localStorage.setItem('zest_fcm_token', token.value);

      const userId = currentUser?.uid || currentUser?.id;
      if (userId) {
        await saveDeviceTokenRealtime(userId, token.value, {
          nickname: currentUser?.nickname || 'Player',
          email: currentUser?.email || '',
          platform: Capacitor.getPlatform()
        });
      }
    });

    // 5. Listeners: Registration error
    await PushNotifications.addListener('registrationError', (error) => {
      console.warn('[PushNotifications] Registration error:', error);
    });

    // 6. Listeners: Push notification received while app is in foreground
    await PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('[PushNotifications] Push received in foreground:', notification);
    });

    // 7. Listeners: Push notification clicked by user from lock screen or status bar
    await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('[PushNotifications] Push notification tapped:', action);
      const data = action.notification?.data || {};
      if (typeof onNotificationAction === 'function') {
        onNotificationAction(data);
      }
    });

  } catch (err) {
    console.warn('[PushNotifications] Error initializing push notifications:', err);
  }
};

/**
 * Dispatch Push Notification to all users (or target UIDs) via Make.com Webhook and Cloud
 */
export const dispatchPushNotification = async (notificationData) => {
  try {
    // Dispatch through Make.com Webhook with full payload
    await sendToMakeWebhook({
      eventType: 'PUSH_NOTIFICATION_BROADCAST',
      title: notificationData.title || 'ZEST TOURNAMENT',
      message: notificationData.message || '',
      type: notificationData.type || 'info',
      targetTournamentId: notificationData.targetTournamentId || null,
      targetUids: notificationData.targetUids || [],
      details: `Closed-App Push Notification Broadcast: "${notificationData.title}"`
    });

    console.log('[PushNotifications] Push broadcast dispatched to Make.com Webhook.');
  } catch (err) {
    console.warn('[PushNotifications] Webhook push dispatch warning:', err);
  }
};
