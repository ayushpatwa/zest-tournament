// Service to handle Make.com Webhook integrations for Google Sheets logging

const WEBHOOK_STORAGE_KEY = 'zest_make_webhook_url';
export const DEFAULT_MAKE_WEBHOOK_URL = 'https://hook.eu1.make.com/ljeqrnyu7aeyzqzimj5dtm3ei29eq24j';

export const sanitizeWebhookUrl = (input) => {
  if (!input) return '';
  let url = input.trim();
  
  // If user pasted in mailhook format "id@hook.eu1.make.com"
  if (url.includes('@')) {
    const parts = url.split('@');
    const id = parts[0];
    const host = parts[1] || 'hook.eu1.make.com';
    url = `https://${host}/${id}`;
  } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://hook.eu1.make.com/${url}`;
  }
  return url;
};

export const getWebhookUrl = () => {
  const saved = localStorage.getItem(WEBHOOK_STORAGE_KEY);
  if (saved) {
    if (saved.includes('d7lav19d6j4mxvuittql3pkdb8vwzs55')) {
      localStorage.setItem(WEBHOOK_STORAGE_KEY, DEFAULT_MAKE_WEBHOOK_URL);
      return DEFAULT_MAKE_WEBHOOK_URL;
    }
    return sanitizeWebhookUrl(saved);
  }
  return DEFAULT_MAKE_WEBHOOK_URL;
};

export const setWebhookUrl = (url) => {
  if (!url || !url.trim()) {
    localStorage.removeItem(WEBHOOK_STORAGE_KEY);
  } else {
    const sanitized = sanitizeWebhookUrl(url);
    localStorage.setItem(WEBHOOK_STORAGE_KEY, sanitized);
  }
};

/**
 * Sends event data to Make.com Webhook which appends a row into Google Sheet
 * @param {Object} eventData
 * @param {string} eventData.eventType - USER_SIGNUP | USER_LOGIN | TOURNAMENT_JOIN | WALLET_DEPOSIT | TEST_PING
 * @param {string} eventData.nickname - Player in-game name
 * @param {string} eventData.ffUid - Free Fire UID
 * @param {string} eventData.email - Player email
 * @param {string} eventData.phone - Player phone number
 * @param {string} eventData.details - Description or amount
 */
export const sendToMakeWebhook = async (eventData) => {
  const webhookUrl = getWebhookUrl();
  const payload = {
    timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    eventType: eventData.eventType || 'GENERAL_EVENT',
    nickname: eventData.nickname || 'Unknown',
    ffUid: String(eventData.ffUid || 'N/A'),
    email: eventData.email || 'N/A',
    phone: String(eventData.phone || 'N/A'),
    details: eventData.details || '',
    device: typeof window !== 'undefined' && window.innerWidth < 768 ? 'Mobile App' : 'Desktop Web',
    rawTime: new Date().toISOString()
  };

  console.log('[Make.com Webhook] Dispatching to:', webhookUrl, payload);

  if (!webhookUrl) {
    console.warn('[Make.com Webhook] No Webhook URL configured.');
    return { success: true, simulated: true, payload };
  }

  // Attempt 1: Standard fetch with JSON
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=UTF-8', // text/plain skips CORS preflight block
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    console.log('[Make.com Webhook] Server response:', response.status, responseText);

    if (response.ok || response.type === 'opaque' || responseText === 'Accepted') {
      return { success: true, payload, message: responseText };
    }
  } catch (err) {
    console.warn('[Make.com Webhook] Standard POST encountered error, trying fallback no-cors mode:', err);
  }

  // Attempt 2: Fallback no-cors mode
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    console.log('[Make.com Webhook] Dispatched via no-cors fallback.');
    return { success: true, fallback: true, payload };
  } catch (error) {
    console.error('[Make.com Webhook] Both attempts failed:', error);
    return { success: false, error: error.message, payload };
  }
};
