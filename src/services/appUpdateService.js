import { Capacitor } from '@capacitor/core';

// App Version & Update Service
export const CURRENT_APP_VERSION = '1.4.4';
export const CURRENT_BUILD_NUMBER = 6;

/**
 * Checks if the user is running the installed native Android/iOS APK
 */
export const isNativeApp = () => {
  try {
    return Capacitor.isNativePlatform();
  } catch (e) {
    return false;
  }
};

/**
 * Compares semantic version strings (e.g., '1.1.0' > '1.0.0')
 * Returns true if latest > current and not already updated/dismissed
 */
export const isNewVersionAvailable = (currentVer = CURRENT_APP_VERSION, latestVer = '1.0.0', allowWeb = false, forceUpdate = false) => {
  // If user is on regular web browser and allowWeb is not enabled, do not show APK popup
  if (!allowWeb && !isNativeApp()) {
    return false;
  }

  if (!latestVer || typeof latestVer !== 'string') return false;
  
  const cleanCurrent = currentVer.replace(/^v/i, '').trim();
  const cleanLatest = latestVer.replace(/^v/i, '').trim();
  
  // If user is already on this version or higher, no update needed!
  if (cleanCurrent === cleanLatest) return false;

  // If user has already clicked download/updated to this version or dismissed it, don't show again (unless mandatory forceUpdate)
  if (!forceUpdate && typeof localStorage !== 'undefined') {
    const isUpdated = localStorage.getItem('zest_updated_version_' + cleanLatest) === 'true';
    const isDismissed = localStorage.getItem('zest_last_dismissed_version') === cleanLatest;
    if (isUpdated || isDismissed) {
      return false;
    }
  }

  const currentParts = cleanCurrent.split('.').map(n => parseInt(n, 10) || 0);
  const latestParts = cleanLatest.split('.').map(n => parseInt(n, 10) || 0);

  for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
    const curr = currentParts[i] || 0;
    const lat = latestParts[i] || 0;
    if (lat > curr) return true;
    if (lat < curr) return false;
  }

  return false;
};
