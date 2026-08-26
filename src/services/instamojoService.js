import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { sendToMakeWebhook, getWebhookUrl } from './webhookService';

const STORAGE_KEY = 'zest_instamojo_config';

// Master Instamojo credentials
export const DEFAULT_INSTAMOJO_CONFIG = {
  apiKey: '6da99d471d3bd09da2bd882824f241b6',
  authToken: '992ffc838647c316437ba2699ceb6e0d',
  privateSalt: 'ed14acad1168445291d0174a5ab35cae',
  isLive: true,
  customPaymentLink: ''
};

let dynamicInstamojoConfig = null;

/**
 * Updates Instamojo keys dynamically from Firestore cloud settings
 */
export const updateLiveInstamojoConfig = (config) => {
  if (config) {
    dynamicInstamojoConfig = {
      apiKey: config.apiKey || DEFAULT_INSTAMOJO_CONFIG.apiKey,
      authToken: config.authToken || DEFAULT_INSTAMOJO_CONFIG.authToken,
      privateSalt: config.privateSalt || DEFAULT_INSTAMOJO_CONFIG.privateSalt,
      isLive: config.isLive !== undefined ? config.isLive : DEFAULT_INSTAMOJO_CONFIG.isLive,
      customPaymentLink: config.customPaymentLink || ''
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dynamicInstamojoConfig));
    console.log('[Instamojo Service] Cloud config synced in real-time:', dynamicInstamojoConfig);
  }
};

/**
 * Retrieves current active Instamojo configuration
 */
export const getInstamojoConfig = () => {
  if (dynamicInstamojoConfig) {
    return dynamicInstamojoConfig;
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_INSTAMOJO_CONFIG, ...parsed };
    }
  } catch (_) {}
  return DEFAULT_INSTAMOJO_CONFIG;
};

/**
 * Saves Instamojo configuration locally
 */
export const setInstamojoConfig = (config) => {
  dynamicInstamojoConfig = { ...getInstamojoConfig(), ...config };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dynamicInstamojoConfig));
};

/**
 * Creates an Instamojo Payment Request for Wallet Deposit
 */
export const createInstamojoPaymentRequest = async ({
  amount,
  nickname,
  uid,
  email,
  phone
}) => {
  const config = getInstamojoConfig();
  const numAmount = parseFloat(amount).toFixed(2);
  const cleanPhone = String(phone || '9876543210').replace(/[^0-9]/g, '').slice(-10);
  const cleanEmail = email && email.includes('@') ? email.trim().toLowerCase() : 'player@zest.gg';
  const cleanNick = String(nickname || 'Zest Player').trim();
  const cleanUid = String(uid || 'Gamer').trim();

  const purpose = `ZEST WALLET - ${cleanNick} (${cleanUid})`;
  const redirectUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}${window.location.pathname}?payment=success&gateway=instamojo&amount=${numAmount}&uid=${encodeURIComponent(cleanUid)}`
    : 'https://zest-tournament.vercel.app/?payment=success';
  const webhookUrl = getWebhookUrl();

  console.log('[Instamojo Service] Creating Payment Request:', {
    amount: numAmount,
    purpose,
    nickname: cleanNick,
    email: cleanEmail,
    phone: cleanPhone
  });

  // Check if custom static payment link is provided
  if (config.customPaymentLink && config.customPaymentLink.trim()) {
    let customUrl = config.customPaymentLink.trim();
    const separator = customUrl.includes('?') ? '&' : '?';
    customUrl = `${customUrl}${separator}amount=${numAmount}&data_name=${encodeURIComponent(cleanNick)}&data_email=${encodeURIComponent(cleanEmail)}&data_phone=${cleanPhone}&data_custom_field_1=${encodeURIComponent(cleanUid)}`;
    return { success: true, paymentUrl: customUrl };
  }

  // Primary API Endpoint based on Live / Test mode
  const apiBase = config.isLive 
    ? 'https://www.instamojo.com/api/1.1/payment-requests/'
    : 'https://test.instamojo.com/api/1.1/payment-requests/';

  const formData = new URLSearchParams();
  formData.append('amount', numAmount);
  formData.append('purpose', purpose);
  formData.append('buyer_name', cleanNick);
  formData.append('email', cleanEmail);
  formData.append('phone', cleanPhone);
  formData.append('redirect_url', redirectUrl);
  if (webhookUrl) formData.append('webhook', webhookUrl);
  formData.append('send_email', 'False');
  formData.append('send_sms', 'False');
  formData.append('allow_repeated_payments', 'False');

  // Attempt 1: Direct CORS-proxy or Direct API fetch
  try {
    const response = await fetch(apiBase, {
      method: 'POST',
      headers: {
        'X-Api-Key': config.apiKey,
        'X-Auth-Token': config.authToken,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.payment_request?.longurl) {
        return { 
          success: true, 
          paymentUrl: data.payment_request.longurl,
          requestId: data.payment_request.id 
        };
      }
    }
  } catch (err) {
    console.warn('[Instamojo Service] Direct browser call warning (CORS), routing via secure fallback:', err);
  }

  // Attempt 2: Route via Make.com Webhook with fallback payment URL
  await sendToMakeWebhook({
    eventType: 'INSTAMOJO_DEPOSIT_INIT',
    nickname: cleanNick,
    ffUid: cleanUid,
    email: cleanEmail,
    phone: cleanPhone,
    amount: numAmount,
    details: `Initiated Instamojo Deposit of ₹${numAmount} for ${cleanNick} (UID: ${cleanUid})`
  });

  // Fallback: Generate smart direct payment link with prefilled parameters
  const fallbackUrl = `https://www.instamojo.com/@ayushpatwa/?amount=${numAmount}&data_name=${encodeURIComponent(cleanNick)}&data_email=${encodeURIComponent(cleanEmail)}&data_phone=${cleanPhone}&data_custom_field_1=${encodeURIComponent(cleanUid)}`;

  return {
    success: true,
    paymentUrl: fallbackUrl,
    simulated: true
  };
};

/**
 * Opens Instamojo Checkout page seamlessly in Native App Browser or Web
 */
export const openInstamojoCheckout = async ({ paymentUrl, onComplete, onDismiss }) => {
  if (!paymentUrl) {
    alert('Invalid payment link. Please try again.');
    return;
  }

  try {
    if (Capacitor.isNativePlatform()) {
      // In Android APK / iOS - opens in native Chrome Custom Tab / In-App Browser
      await Browser.open({ 
        url: paymentUrl,
        windowName: '_blank',
        presentationStyle: 'popover'
      });

      const removeListener = await Browser.addListener('browserFinished', () => {
        console.log('[Instamojo Browser] In-App Browser closed by user');
        if (onComplete) onComplete();
        removeListener.remove();
      });
    } else {
      // On Desktop / Mobile Web
      window.open(paymentUrl, '_blank', 'noopener,noreferrer');
      if (onComplete) onComplete();
    }
  } catch (error) {
    console.warn('[Instamojo Browser] Native browser error, falling back to window.open:', error);
    window.open(paymentUrl, '_blank', 'noopener,noreferrer');
    if (onComplete) onComplete();
  }
};
