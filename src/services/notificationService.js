import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { saveDeviceTokenRealtime } from './firebase';

let pushInitialized = false;
const processedNotificationIds = new Set();

/**
 * Generates safe 32-bit positive integer hash for Android notification IDs
 */
const getNotificationNumericId = (val) => {
  if (typeof val === 'number') return Math.abs(val) % 2147483647;
  const str = String(val || Date.now());
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 2147483647;
};

/**
 * Directly pops a system notification banner in the Android notification panel & status bar
 */
export const showSystemNotification = async ({ id, title, body, extra = {} }) => {
  const notifIdStr = String(id || `${Date.now()}_${Math.random()}`);
  if (processedNotificationIds.has(notifIdStr)) {
    return;
  }
  processedNotificationIds.add(notifIdStr);

  // Keep cache bounded
  if (processedNotificationIds.size > 200) {
    const oldestKey = processedNotificationIds.values().next().value;
    processedNotificationIds.delete(oldestKey);
  }

  const numericId = getNotificationNumericId(id || notifIdStr);

  if (Capacitor.isNativePlatform()) {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title: title || '⚡ ZEST TOURNAMENT',
            body: body || '',
            id: numericId,
            channelId: 'zest_alerts',
            sound: 'default',
            extra: extra,
            schedule: { at: new Date(Date.now() + 50) }
          }
        ]
      });
      console.log(`[NotificationService] ✅ Notification "${title}" posted to Android notification panel (ID: ${numericId})`);
    } catch (err) {
      console.warn('[NotificationService] LocalNotifications schedule error:', err);
    }
  } else {
    // Web Browser notification fallback
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title || '⚡ ZEST TOURNAMENT', {
          body: body || '',
          icon: '/favicon.ico'
        });
      } catch (e) {}
    }
  }
};

/**
 * Initialize Push Notifications, Local Notification Channels & Android Status Bar integration
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

    // 1. Setup Local Notification Channel (Ensures Heads-Up banner + Sound + Vibration in Notification Panel)
    try {
      await LocalNotifications.createChannel({
        id: 'zest_alerts',
        name: 'Zest Match Alerts & Room Drops',
        description: 'Instant alerts for Room ID drops, match reminders, and tournament announcements',
        importance: 5, // High importance: pops heads-up banner on screen & drops into status bar
        visibility: 1, // Public on lockscreen
        sound: 'default',
        vibration: true,
        lights: true,
        lightColor: '#00e5ff'
      });
      console.log('[PushNotifications] Local notification channel "zest_alerts" ready.');
    } catch (chanErr) {
      console.warn('[PushNotifications] Local channel creation warning:', chanErr);
    }

    // 2. Request Local Notification permissions (Android 13+ POST_NOTIFICATIONS)
    try {
      let localPerm = await LocalNotifications.checkPermissions();
      if (localPerm.display !== 'granted') {
        localPerm = await LocalNotifications.requestPermissions();
      }
      console.log('[PushNotifications] Local notifications permission:', localPerm.display);
    } catch (permErr) {
      console.warn('[PushNotifications] Local permission check warning:', permErr);
    }

    // 3. Setup Remote Push Notification Channel
    try {
      await PushNotifications.createChannel({
        id: 'zest_alerts',
        name: 'Zest Match Alerts & Room Drops',
        description: 'Instant alerts for Room ID drops, match reminders, and tournament announcements',
        importance: 5,
        visibility: 1,
        sound: 'default',
        vibration: true,
        lights: true,
        lightColor: '#ff2a5f'
      });
    } catch (_) {}

    // 4. Request Remote Push Permissions
    let permStatus = await PushNotifications.checkPermissions();
    if (permStatus.receive === 'prompt' || permStatus.receive === 'prompt-with-rationale') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive === 'granted') {
      // 5. Register device with FCM
      await PushNotifications.register();
    }

    // 6. Listeners: Registration success (FCM Token received)
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

    // 7. Listeners: Registration error
    await PushNotifications.addListener('registrationError', (error) => {
      console.warn('[PushNotifications] Registration error:', error);
    });

    // 8. Listeners: Push notification received while app is in foreground
    // Android suppresses foreground remote pushes by default, so we explicitly drop it into the panel!
    await PushNotifications.addListener('pushNotificationReceived', async (notification) => {
      console.log('[PushNotifications] Push received in foreground, showing in notification panel:', notification);
      await showSystemNotification({
        id: notification.id || `push_${Date.now()}`,
        title: notification.title || '⚡ ZEST TOURNAMENT',
        body: notification.body || '',
        extra: notification.data || {}
      });
    });

    // 9. Listeners: Push notification tapped by user from lock screen or status bar
    await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      console.log('[PushNotifications] Remote notification tapped:', action);
      const data = action.notification?.data || {};
      if (typeof onNotificationAction === 'function') {
        onNotificationAction(data);
      }
    });

    // 10. Listeners: Local notification tapped by user
    await LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
      console.log('[PushNotifications] Local notification tapped:', action);
      const data = action.notification?.extra || {};
      if (typeof onNotificationAction === 'function') {
        onNotificationAction(data);
      }
    });

  } catch (err) {
    console.warn('[PushNotifications] Error initializing push notifications:', err);
  }
};

/**
 * Re-syncs FCM Token for the currently logged in user
 */
export const saveCurrentUserToken = async (currentUser) => {
  const token = localStorage.getItem('zest_fcm_token');
  const userId = currentUser?.uid || currentUser?.id;
  if (token && userId) {
    await saveDeviceTokenRealtime(userId, token, {
      nickname: currentUser?.nickname || 'Player',
      email: currentUser?.email || '',
      platform: Capacitor.getPlatform()
    });
  }
};

/**
 * Dispatch System Notification to current device and sync
 */
export const dispatchPushNotification = async (notificationData) => {
  try {
    // Trigger local system notification on current device
    await showSystemNotification({
      id: `broadcast_${Date.now()}`,
      title: notificationData.title || 'ZEST TOURNAMENT',
      body: notificationData.message || '',
      extra: {
        tournamentId: notificationData.targetTournamentId,
        type: notificationData.type
      }
    });

    console.log('[PushNotifications] System notification dispatched.');
  } catch (err) {
    console.warn('[PushNotifications] System notification dispatch warning:', err);
  }
};
