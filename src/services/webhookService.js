// Service to handle Make.com Webhook integrations for Google Sheets logging

const WEBHOOK_STORAGE_KEY = 'zest_make_webhook_url';

export const getWebhookUrl = () => {
  return localStorage.getItem(WEBHOOK_STORAGE_KEY) || '';
};

export const setWebhookUrl = (url) => {
  if (!url) {
    localStorage.removeItem(WEBHOOK_STORAGE_KEY);
  } else {
    localStorage.setItem(WEBHOOK_STORAGE_KEY, url.trim());
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
    ffUid: eventData.ffUid || 'N/A',
    email: eventData.email || 'N/A',
    phone: eventData.phone || 'N/A',
    details: eventData.details || '',
    device: typeof window !== 'undefined' && window.innerWidth < 768 ? 'Mobile App' : 'Desktop Web',
    rawTime: new Date().toISOString()
  };

  console.log('[Make.com Webhook] Dispatching payload:', payload);

  if (!webhookUrl) {
    console.warn('[Make.com Webhook] No Webhook URL configured. Event logged locally.');
    return { success: true, simulated: true, payload };
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (response.ok || response.type === 'opaque') {
      console.log('[Make.com Webhook] Sent successfully to Google Sheet trigger.');
      return { success: true, payload };
    } else {
      console.error('[Make.com Webhook] Server responded with status:', response.status);
      return { success: false, error: `Status ${response.status}`, payload };
    }
  } catch (error) {
    console.error('[Make.com Webhook] Failed to dispatch webhook:', error);
    // Even if CORS or network is blocked, the trigger on Make often executes if sent via standard POST
    return { success: false, error: error.message, payload };
  }
};
