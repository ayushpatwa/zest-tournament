/**
 * Resend.com Email Delivery Service
 * Direct, ultra-fast Email OTP delivery bypassing Make.com queue errors.
 */
import { Capacitor, CapacitorHttp } from '@capacitor/core';

const RESEND_API_KEY_STORAGE = 'zest_resend_api_key';
const RESEND_FROM_EMAIL_STORAGE = 'zest_resend_from_email';

export const DEFAULT_RESEND_FROM = 'Zest Tournament <onboarding@resend.dev>';

let dynamicResendApiKey = null;
let dynamicResendFromEmail = null;

export const getResendApiKey = () => {
  return dynamicResendApiKey || localStorage.getItem(RESEND_API_KEY_STORAGE) || '';
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
 * Builds gaming-themed cyber HTML template for Zest Tournament OTP
 */
export const buildOtpEmailHtml = ({ nickname = 'Player', otpCode, appName = 'Zest Tournament' }) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${appName} Verification Code</title>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #0a0d14; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff;">
  <div style="max-width: 520px; margin: 0 auto; background: #111726; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 12px 40px rgba(0,0,0,0.6);">
    
    <!-- Top Banner -->
    <div style="background: linear-gradient(135deg, #00e5ff 0%, #7c4dff 100%); padding: 26px 20px; text-align: center;">
      <h1 style="margin: 0; color: #000000; font-size: 24px; font-weight: 900; letter-spacing: 1.5px; text-transform: uppercase;">
        ⚡ ${appName}
      </h1>
      <p style="margin: 4px 0 0 0; color: #111111; font-size: 11px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;">
        Free Fire Esports Arena • Verification Code
      </p>
    </div>

    <!-- Main Content -->
    <div style="padding: 32px 24px; text-align: center;">
      <p style="font-size: 16px; color: #e2e8f0; margin: 0 0 12px 0;">
        Hello, <strong style="color: #00e5ff;">${nickname}</strong>!
      </p>
      
      <p style="font-size: 14px; color: #94a3b8; margin: 0 0 24px 0; line-height: 1.5;">
        Your one-time verification code for your <strong>${appName}</strong> account is:
      </p>

      <!-- OTP Box -->
      <div style="background: rgba(0, 229, 255, 0.08); border: 2px dashed #00e5ff; border-radius: 12px; padding: 18px 24px; margin: 0 auto 24px auto; display: inline-block;">
        <span style="font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 900; letter-spacing: 12px; color: #00e5ff; display: block; margin-left: 12px;">
          ${otpCode}
        </span>
      </div>

      <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 8px; padding: 12px; margin-bottom: 20px;">
        <p style="font-size: 12px; color: #e2e8f0; margin: 0 0 4px 0;">
          ⏳ This verification code expires in <strong>5 minutes</strong>.
        </p>
        <p style="font-size: 11px; color: #94a3b8; margin: 0;">
          Do not share this OTP with anyone, including tournament hosts or admins.
        </p>
      </div>

      <p style="font-size: 11px; color: #64748b; margin: 0; line-height: 1.4;">
        If you did not request this verification code, you can safely ignore this email.
      </p>
    </div>

    <!-- Footer -->
    <div style="background: #0b0f19; padding: 16px 20px; text-align: center; border-top: 1px solid #1e293b;">
      <p style="font-size: 11px; color: #64748b; margin: 0 0 4px 0;">
        © ${new Date().getFullYear()} ${appName}. All rights reserved.
      </p>
      <p style="font-size: 10px; color: #475569; margin: 0;">
        Automated High-Performance Esports Platform
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
export const sendResendOtpEmail = async ({ to, nickname = 'Player', otpCode, subject }) => {
  const apiKey = getResendApiKey();
  if (!apiKey) {
    console.warn('[Resend Service] No Resend API Key configured yet.');
    return { success: false, reason: 'NO_API_KEY' };
  }

  const cleanTo = (to || '').trim();
  if (!cleanTo || !cleanTo.includes('@')) {
    return { success: false, reason: 'INVALID_RECIPIENT' };
  }

  const fromEmail = getResendFromEmail();
  const mailSubject = subject || `Your Zest Tournament Verification Code: ${otpCode}`;
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

  // 2. Web Browser: Direct fetch with proxy fallback
  try {
    const rawRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await rawRes.json().catch(() => ({}));
    if (rawRes.ok) {
      console.log('[Resend Service] Web direct dispatch successful:', data);
      return { success: true, id: data.id, data };
    }

    console.warn('[Resend Service] Web direct error:', data);
    return { success: false, error: data.message || `HTTP ${rawRes.status}` };
  } catch (webErr) {
    console.warn('[Resend Service] Direct browser fetch failed (likely CORS), attempting fallback proxy...', webErr);
    try {
      const proxyUrl = 'https://corsproxy.io/?url=' + encodeURIComponent('https://api.resend.com/emails');
      const proxyRes = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const proxyData = await proxyRes.json().catch(() => ({}));
      if (proxyRes.ok) {
        return { success: true, id: proxyData.id, data: proxyData };
      }
      return { success: false, error: proxyData.message || `Proxy HTTP ${proxyRes.status}` };
    } catch (proxyErr) {
      return { success: false, error: webErr.message };
    }
  }
};
