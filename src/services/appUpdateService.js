// App Version & Update Service
export const CURRENT_APP_VERSION = '1.0.0';
export const CURRENT_BUILD_NUMBER = 1;

/**
 * Compares semantic version strings (e.g., '1.0.1' > '1.0.0')
 * Returns true if latest > current
 */
export const isNewVersionAvailable = (currentVer = CURRENT_APP_VERSION, latestVer = '1.0.0') => {
  if (!latestVer || typeof latestVer !== 'string') return false;
  
  const cleanCurrent = currentVer.replace(/^v/i, '').trim();
  const cleanLatest = latestVer.replace(/^v/i, '').trim();
  
  if (cleanCurrent === cleanLatest) return false;

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
