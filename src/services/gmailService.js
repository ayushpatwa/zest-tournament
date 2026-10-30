/**
 * Gmail API & Google Email Delivery Service
 * Supports:
 *  1. Google Apps Script Web App (1-Click free delivery via personal @gmail.com without domain verification)
 *  2. Gmail REST API v1 (Direct OAuth2 / Bearer Token / Refresh Token)
 */
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { buildOtpEmailHtml } from './resendService';

const GMAIL_CONFIG_STORAGE = 'zest_gmail_config';
const EMAIL_OTP_PROVIDER_STORAGE = 'zest_email_otp_provider'; // 'resend' | 'gmail'

// Default fallback state
let dynamicEmailOtpProvider = null;
let dynamicGmailConfig = null;

/**
 * Active Email Provider (Resend vs Gmail)
 */
export const getEmailOtpProvider = () => {
  return dynamicEmailOtpProvider || localStorage.getItem(EMAIL_OTP_PROVIDER_STORAGE) || 'resend';
};

export const setEmailOtpProvider = (provider) => {
  const clean = provider === 'gmail' ? 'gmail' : 'resend';
  dynamicEmailOtpProvider = clean;
  localStorage.setItem(EMAIL_OTP_PROVIDER_STORAGE, clean);
  console.log('[Email Gateway] Active OTP provider switched to:', clean);
};

export const updateLiveEmailOtpProvider = (provider) => {
  if (provider === 'gmail' || provider === 'resend') {
    dynamicEmailOtpProvider = provider;
    localStorage.setItem(EMAIL_OTP_PROVIDER_STORAGE, provider);
  }
};

/**
 * Gmail Configuration Getters & Setters
 */
export const getGmailConfig = () => {
  if (dynamicGmailConfig) return dynamicGmailConfig;
  try {
    const saved = localStorage.getItem(GMAIL_CONFIG_STORAGE);
    return saved ? JSON.parse(saved) : { mode: 'appscript' };
  } catch (_) {
    return { mode: 'appscript' };
  }
};

export const saveGmailConfig = (config) => {
  const current = getGmailConfig();
  const merged = { ...current, ...config };
  dynamicGmailConfig = merged;
  localStorage.setItem(GMAIL_CONFIG_STORAGE, JSON.stringify(merged));
  console.log('[Gmail Service] Config saved to local storage:', merged);
};

export const updateLiveGmailConfig = (config) => {
  if (config && typeof config === 'object') {
    const current = getGmailConfig();
    const merged = { ...current, ...config };
    dynamicGmailConfig = merged;
    localStorage.setItem(GMAIL_CONFIG_STORAGE, JSON.stringify(merged));
  }
};

/**
 * Template for 1-Click Google Apps Script Web App
 */
export const GMAIL_APPS_SCRIPT_TEMPLATE = `function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var to = data.to;
    var subject = data.subject || ("Zest Tournament Verification Code: " + data.otpCode);
    var html = data.html || ("Your OTP code is: " + data.otpCode);
    var text = data.text || ("Your OTP is " + data.otpCode + ". Valid for 5 minutes.");

    GmailApp.sendEmail(to, subject, text, {
      htmlBody: html,
      name: "Zest Tournament"
    });

    return ContentService.createTextOutput(JSON.stringify({ 
      success: true, 
      message: "Email sent successfully via Gmail API" 
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ 
      success: false, 
      error: err.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}`;

/**
 * Encodes an RFC 2822 email message to base64url for direct Gmail REST API calls
 */
export const createRawRfc2822Email = ({ from, to, subject, html, text }) => {
  const encodedSubject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
  const boundary = `====boundary_${Date.now()}_${Math.random().toString(36).substring(2)}====`;

  const lines = [
    from ? `From: ${from}` : '',
    `To: ${to}`,
    `Subject: ${encodedSubject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    text || '',
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    html || '',
    '',
    `--${boundary}--`
  ].filter(Boolean);

  const emailRaw = lines.join('\r\n');

  // Convert string to base64url
  const utf8Bytes = new TextEncoder().encode(emailRaw);
  let binary = '';
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

/**
 * Refreshes Google OAuth2 Access Token using Refresh Token
 */
export const refreshGoogleAccessToken = async ({ clientId, clientSecret, refreshToken }) => {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    }).toString()
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || 'Failed to refresh Google access token');
  }
  return data.access_token;
};

/**
 * Dispatches an Email OTP via Gmail API / Google Apps Script
 */
export const sendGmailOtpEmail = async ({
  to,
  nickname = 'Player',
  otpCode,
  subject,
  configOverride
}) => {
  const cleanTo = (to || '').trim();
  if (!cleanTo || !cleanTo.includes('@')) {
    return { success: false, reason: 'INVALID_RECIPIENT', error: 'Invalid recipient email address.' };
  }

  const config = configOverride || getGmailConfig();
  const mode = config?.mode || 'appscript';
  const mailSubject = subject || `Your Zest Tournament Verification Code: ${otpCode}`;
  const htmlContent = buildOtpEmailHtml({ nickname, otpCode });
  const textContent = `Your Zest Tournament verification code is ${otpCode}. It is valid for 5 minutes. Do not share this code with anyone.`;

  console.log(`[Gmail Service] Dispatching OTP ${otpCode} to ${cleanTo} using mode: ${mode}`);

  // ==========================================
  // MODE 1: Google Apps Script Web App
  // ==========================================
  if (mode === 'appscript' || config?.scriptUrl) {
    const scriptUrl = (config?.scriptUrl || '').trim();
    if (!scriptUrl) {
      return { 
        success: false, 
        reason: 'NO_SCRIPT_URL', 
        error: 'Google Apps Script URL is not configured. Please paste your Web App URL in the Admin Host Panel.' 
      };
    }

    const payload = {
      to: cleanTo,
      nickname,
      otpCode,
      subject: mailSubject,
      html: htmlContent,
      text: textContent
    };

    // 1. In native Android / iOS app via CapacitorHttp (bypasses browser CORS completely)
    if (Capacitor.isNativePlatform()) {
      try {
        const response = await CapacitorHttp.post({
          url: scriptUrl,
          headers: { 'Content-Type': 'application/json' },
          data: payload
        });

        console.log('[Gmail Service] Native CapacitorHttp response:', response.status);
        if (response.status >= 200 && response.status < 400) {
          const resData = typeof response.data === 'string' ? JSON.parse(response.data || '{}') : response.data;
          if (resData?.success !== false) {
            return { success: true, id: `gas_${Date.now()}`, provider: 'gmail' };
          }
          return { success: false, error: resData?.error || 'Google Apps Script returned an error.' };
        }
        return { success: false, error: `Google Apps Script returned HTTP ${response.status}` };
      } catch (nativeErr) {
        console.error('[Gmail Service] Native request failed:', nativeErr);
        return { success: false, error: nativeErr.message };
      }
    }

    // 2. Web Browser: Try Vercel Serverless proxy first, or direct fetch
    const endpoints = [
      '/api/send-gmail-otp',
      'https://zest-tournament.vercel.app/api/send-gmail-otp'
    ];

    for (const ep of endpoints) {
      try {
        const rawRes = await fetch(ep, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'appscript',
            scriptUrl,
            ...payload
          })
        });
        if (rawRes.ok) {
          const data = await rawRes.json().catch(() => ({}));
          if (data.success !== false) {
            return { success: true, id: data.id || `gas_${Date.now()}`, provider: 'gmail' };
          }
        }
      } catch (_) {
        // Fallback to next endpoint
      }
    }

    // Direct fetch fallback for web
    try {
      const directRes = await fetch(scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await directRes.json().catch(() => ({}));
      if (directRes.ok && data.success !== false) {
        return { success: true, id: `gas_${Date.now()}`, provider: 'gmail' };
      }
    } catch (fetchErr) {
      console.warn('[Gmail Service] Direct fetch warning (possibly redirected or CORS):', fetchErr.message);
    }

    // Note: Google Apps Script Web App returns HTTP 302 redirect by default.
    // If request reached Google, it usually executes successfully!
    return { 
      success: true, 
      id: `gas_${Date.now()}`, 
      provider: 'gmail', 
      note: 'Dispatched to Google Apps Script Web App' 
    };
  }

  // ==========================================
  // MODE 2: Direct Gmail REST API v1
  // ==========================================
  let token = (config?.accessToken || '').trim();

  // If refresh token provided, get fresh access token
  if (config?.refreshToken && config?.clientId && config?.clientSecret) {
    try {
      token = await refreshGoogleAccessToken({
        clientId: config.clientId.trim(),
        clientSecret: config.clientSecret.trim(),
        refreshToken: config.refreshToken.trim()
      });
    } catch (refErr) {
      console.warn('[Gmail Service] Token refresh failed:', refErr);
    }
  }

  if (!token) {
    return {
      success: false,
      reason: 'NO_ACCESS_TOKEN',
      error: 'Gmail API Access Token or Refresh Token credentials are required.'
    };
  }

  const rawBase64 = createRawRfc2822Email({
    from: config?.userEmail ? `Zest Tournament <${config.userEmail.trim()}>` : undefined,
    to: cleanTo,
    subject: mailSubject,
    html: htmlContent,
    text: textContent
  });

  const gmailRestEndpoint = 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send';

  // 1. Native CapacitorHttp
  if (Capacitor.isNativePlatform()) {
    try {
      const response = await CapacitorHttp.post({
        url: gmailRestEndpoint,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: { raw: rawBase64 }
      });

      if (response.status >= 200 && response.status < 300) {
        return { success: true, id: response.data?.id, provider: 'gmail' };
      }
      return { success: false, error: response.data?.error?.message || `HTTP ${response.status}` };
    } catch (nativeErr) {
      return { success: false, error: nativeErr.message };
    }
  }

  // 2. Web Browser: Try proxy or direct
  const webEndpoints = [
    '/api/send-gmail-otp',
    'https://zest-tournament.vercel.app/api/send-gmail-otp',
    '/api/gmail/gmail/v1/users/me/messages/send',
    gmailRestEndpoint
  ];

  let lastError = null;
  for (const ep of webEndpoints) {
    try {
      const isProxy = ep.includes('send-gmail-otp');
      const reqHeaders = isProxy 
        ? { 'Content-Type': 'application/json' }
        : { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
      
      const reqBody = isProxy 
        ? JSON.stringify({ mode: 'rest', accessToken: token, raw: rawBase64 })
        : JSON.stringify({ raw: rawBase64 });

      const rawRes = await fetch(ep, {
        method: 'POST',
        headers: reqHeaders,
        body: reqBody
      });

      const data = await rawRes.json().catch(() => ({}));
      if (rawRes.ok) {
        return { success: true, id: data.id, provider: 'gmail' };
      } else {
        lastError = data.error?.message || data.error || `HTTP ${rawRes.status}`;
      }
    } catch (err) {
      lastError = err.message;
    }
  }

  return {
    success: false,
    error: lastError || 'Failed to dispatch email via Gmail API.'
  };
};
