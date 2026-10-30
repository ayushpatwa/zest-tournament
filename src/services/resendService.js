/**
 * Resend.com Email Delivery Service
 * Direct, ultra-fast Email OTP delivery bypassing Make.com queue errors.
 */
import { Capacitor, CapacitorHttp } from '@capacitor/core';

const RESEND_API_KEY_STORAGE = 'zest_resend_api_key';
const RESEND_FROM_EMAIL_STORAGE = 'zest_resend_from_email';

export const DEFAULT_RESEND_API_KEY = typeof atob === 'function' ? atob('cmVfNnVRYU1GV2ZfNGN6YWU1ZEJHOTRxY0NKd212WnQydWJt') : '';
export const DEFAULT_RESEND_FROM = 'Zest Tournament <noreply@zesttournament.online>';

let dynamicResendApiKey = null;
let dynamicResendFromEmail = null;

export const getResendApiKey = () => {
  return dynamicResendApiKey || localStorage.getItem(RESEND_API_KEY_STORAGE) || DEFAULT_RESEND_API_KEY;
};

export const getResendFromEmail = () => {
  return dynamicResendFromEmail || localStorage.getItem(RESEND_FROM_EMAIL_STORAGE) || DEFAULT_RESEND_FROM;
};

export const updateLiveResendConfig = ({ apiKey, fromEmail }) => {
  if (apiKey !== undefined && apiKey !== null) {
    dynamicResendApiKey = apiKey.trim();
    if (dynamicResendApiKey) {
      localStorage.setItem(RESEND_API_KEY_STORAGE, dynamicResendApiKey);
    }
  }
  if (fromEmail !== undefined && fromEmail !== null) {
    dynamicResendFromEmail = fromEmail.trim();
    if (dynamicResendFromEmail) {
      localStorage.setItem(RESEND_FROM_EMAIL_STORAGE, dynamicResendFromEmail);
    }
  }
  console.log('[Resend Service] Live config updated. Sender:', getResendFromEmail());
};

export const saveResendConfig = ({ apiKey, fromEmail }) => {
  if (apiKey !== undefined) {
    dynamicResendApiKey = apiKey ? apiKey.trim() : '';
    if (dynamicResendApiKey) {
      localStorage.setItem(RESEND_API_KEY_STORAGE, dynamicResendApiKey);
    } else {
      localStorage.removeItem(RESEND_API_KEY_STORAGE);
    }
  }
  if (fromEmail !== undefined) {
    dynamicResendFromEmail = fromEmail ? fromEmail.trim() : '';
    if (dynamicResendFromEmail) {
      localStorage.setItem(RESEND_FROM_EMAIL_STORAGE, dynamicResendFromEmail);
    } else {
      localStorage.removeItem(RESEND_FROM_EMAIL_STORAGE);
    }
  }
};

/**
 * Builds high-deliverability, anti-spam HTML template for Zest Tournament OTP
 * Optimized for Gmail, Outlook, and Yahoo Primary Inbox delivery
 */
export const buildOtpEmailHtml = ({ nickname = 'Player', otpCode, appName = 'Zest Tournament' }) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${otpCode} is your ${appName} code</title>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <!-- Hidden Preheader for Inbox Preview -->
  <div style="display: none; font-size: 1px; color: #f1f5f9; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    ${otpCode} is your security verification code for ${appName}. Valid for 5 minutes.
  </div>

  <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.06);">
    
    <!-- Top Header -->
    <div style="background: #0f172a; padding: 22px 20px; text-align: center; border-bottom: 3px solid #00e5ff;">
      <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase;">
        ⚡ ${appName}
      </h1>
      <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase;">
        Account Verification
      </p>
    </div>

    <!-- Main Content -->
    <div style="padding: 28px 24px; text-align: center;">
      <p style="font-size: 15px; color: #334155; margin: 0 0 10px 0;">
        Hello <strong>${nickname}</strong>,
      </p>
      
      <p style="font-size: 14px; color: #64748b; margin: 0 0 20px 0; line-height: 1.5;">
        Your one-time security verification code is:
      </p>

      <!-- Clean High-Contrast OTP Code Box -->
      <div style="background: #f8fafc; border: 2px dashed #00b4d8; border-radius: 10px; padding: 16px 20px; margin: 0 auto 20px auto; display: inline-block;">
        <span style="font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Courier New', monospace; font-size: 32px; font-weight: 900; letter-spacing: 10px; color: #0284c7; display: block; margin-left: 10px;">
          ${otpCode}
        </span>
      </div>

      <div style="background: #f1f5f9; border-radius: 8px; padding: 12px; margin-bottom: 18px; text-align: left;">
        <p style="font-size: 12px; color: #475569; margin: 0 0 4px 0;">
          ⏱️ This code is valid for <strong>5 minutes</strong>.
        </p>
        <p style="font-size: 11px; color: #64748b; margin: 0;">
          Never share this code with anyone. Our team will never ask for your code.
        </p>
      </div>

      <p style="font-size: 11px; color: #94a3b8; margin: 0; line-height: 1.4;">
        If you did not request this verification code, please disregard this email.
      </p>
    </div>

    <!-- Clean Footer -->
    <div style="background: #f8fafc; padding: 14px 20px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="font-size: 11px; color: #94a3b8; margin: 0 0 3px 0;">
        © ${new Date().getFullYear()} ${appName}. All rights reserved.
      </p>
      <p style="font-size: 10px; color: #cbd5e1; margin: 0;">
        Automated Security Notification Service
      </p>
    </div>

  </div>
</body>
</html>
  `;
};

/**
 * Sends OTP Email directly via Resend.com REST API
 */
export const sendResendOtpEmail = async ({ 
  to, 
  nickname = 'Player', 
  otpCode, 
  subject,
  apiKey: apiKeyOverride,
  fromEmail: fromEmailOverride
}) => {
  const apiKey = (apiKeyOverride || getResendApiKey() || '').trim();
  if (!apiKey) {
    console.warn('[Resend Service] No Resend API Key configured yet.');
    return { success: false, reason: 'NO_API_KEY', error: 'Please enter your Resend.com API Key (re_...).' };
  }

  const cleanTo = (to || '').trim();
  if (!cleanTo || !cleanTo.includes('@')) {
    return { success: false, reason: 'INVALID_RECIPIENT', error: 'Invalid recipient email address.' };
  }

  const fromEmail = (fromEmailOverride || getResendFromEmail() || DEFAULT_RESEND_FROM).trim();
  const mailSubject = subject || `${otpCode} is your Zest verification code`;
  const htmlContent = buildOtpEmailHtml({ nickname, otpCode });
  const textContent = `Your Zest Tournament verification code is ${otpCode}. It is valid for 5 minutes. Do not share this code with anyone.`;

  const payload = {
    from: fromEmail,
    to: [cleanTo],
    subject: mailSubject,
    html: htmlContent,
    text: textContent
  };

  console.log(`[Resend Service] Dispatching OTP ${otpCode} to ${cleanTo} via Resend.com...`);

  // 1. In native Android / iOS app via CapacitorHttp (Bypasses CORS completely)
  if (Capacitor.isNativePlatform()) {
    try {
      const response = await CapacitorHttp.post({
        url: 'https://api.resend.com/emails',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        data: payload
      });

      console.log('[Resend Service] Native HTTP Response Status:', response.status);

      if (response.status >= 200 && response.status < 300) {
        return { success: true, id: response.data?.id, data: response.data };
      } else {
        const errorMsg = response.data?.message || `HTTP ${response.status}`;
        console.error('[Resend Service] Native HTTP Error:', errorMsg, response.data);
        return { success: false, error: errorMsg, data: response.data };
      }
    } catch (nativeErr) {
      console.error('[Resend Service] Native request exception:', nativeErr);
      return { success: false, error: nativeErr.message };
    }
  }

  // 2. Web Browser: Try Vite proxy / Netlify proxy, Vercel Serverless proxy, or direct fetch
  const webEndpoints = [];
  if (typeof window !== 'undefined') {
    // 1. Vite proxy / Netlify rewrite proxy (bypasses browser CORS on local dev or Netlify)
    webEndpoints.push('/api/resend/emails');
    // 2. Relative Vercel serverless function (if deployed on Vercel)
    webEndpoints.push('/api/send-otp');
    // 3. Global Cloud Proxy on Vercel (bypasses CORS from any browser / domain / localhost)
    webEndpoints.push('https://zest-tournament.vercel.app/api/send-otp');
    // 4. Direct Resend endpoint (fallback)
    webEndpoints.push('https://api.resend.com/emails');
  } else {
    webEndpoints.push('https://zest-tournament.vercel.app/api/send-otp');
    webEndpoints.push('https://api.resend.com/emails');
  }

  let lastError = null;
  for (const endpoint of webEndpoints) {
    try {
      const rawRes = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await rawRes.json().catch(() => ({}));
      if (rawRes.ok) {
        console.log(`[Resend Service] Web dispatch via ${endpoint} successful:`, data);
        return { success: true, id: data.id, data };
      } else {
        lastError = data.message || `HTTP ${rawRes.status}`;
        console.warn(`[Resend Service] Web dispatch via ${endpoint} returned error:`, lastError);
      }
    } catch (endpointErr) {
      lastError = endpointErr.message;
      console.warn(`[Resend Service] Failed to dispatch via ${endpoint}:`, endpointErr.message);
    }
  }

  let friendlyError = lastError || 'Failed to dispatch email';
  if (lastError === 'Failed to fetch') {
    friendlyError = 'Browser CORS blocked direct request. In the Android APK app, this works 100% natively without CORS! On web, please deploy on Netlify/Vercel or test directly inside the Android APK.';
  } else if (String(friendlyError).toLowerCase().includes('api key is invalid')) {
    friendlyError = 'Resend API Key is invalid or expired. Please generate a new key in your Resend.com dashboard.';
  } else if (String(friendlyError).toLowerCase().includes('domain') && String(friendlyError).toLowerCase().includes('not verified')) {
    friendlyError = 'Domain not verified. Verify your domain at resend.com/domains or use onboarding@resend.dev for test sending.';
  }

  return { 
    success: false, 
    error: friendlyError
  };
};
