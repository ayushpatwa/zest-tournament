/**
 * OTP Service for Automating Email and SMS Verification Delivery
 */
import { sendToMakeWebhook } from './webhookService';

// Storage keys for optional direct Email / SMS gateway credentials
const EMAILJS_CONFIG_KEY = 'zest_emailjs_config';
const SMS_GATEWAY_CONFIG_KEY = 'zest_sms_gateway_config';

export const getEmailConfig = () => {
  return JSON.parse(localStorage.getItem(EMAILJS_CONFIG_KEY) || '{}');
};

export const saveEmailConfig = (config) => {
  localStorage.setItem(EMAILJS_CONFIG_KEY, JSON.stringify(config));
};

export const getSmsGatewayConfig = () => {
  return JSON.parse(localStorage.getItem(SMS_GATEWAY_CONFIG_KEY) || '{}');
};

export const saveSmsGatewayConfig = (config) => {
  localStorage.setItem(SMS_GATEWAY_CONFIG_KEY, JSON.stringify(config));
};

/**
 * Automates sending OTP to user's real Email or SMS
 * @param {Object} params
 * @param {string} params.email - Player's email address
 * @param {string} params.phone - Player's phone number
 * @param {string} params.nickname - Player's in-game nickname
 * @param {string} params.ffUid - Player's Free Fire UID
 * @param {string} params.otpCode - 6-digit verification code
 * @param {string} params.channel - 'email' | 'phone'
 */
export const dispatchRealOtp = async ({ email, phone, nickname, ffUid, otpCode, channel = 'email' }) => {
  console.log(`[OTP Service] Dispatching real OTP ${otpCode} to ${channel.toUpperCase()}:`, channel === 'email' ? email : phone);

  // 1. Send to Make.com Webhook with dedicated OTP parameters
  // (Make.com automatically routes to Gmail / SMS modules in real-time)
  const webhookResult = await sendToMakeWebhook({
    eventType: 'OTP_VERIFICATION',
    nickname: nickname || 'Player',
    ffUid: ffUid || 'N/A',
    email: email || '',
    phone: phone || '',
    otpCode: otpCode,
    channel: channel,
    details: `Automated ${channel.toUpperCase()} OTP Delivery: ${otpCode}`
  });

  // 2. Direct Email Delivery via EmailJS REST API (if user configured EmailJS)
  const emailConfig = getEmailConfig();
  if (channel === 'email' && emailConfig.serviceId && emailConfig.templateId && emailConfig.publicKey) {
    try {
      console.log('[OTP Service] Sending direct email via EmailJS API...');
      await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: emailConfig.serviceId,
          template_id: emailConfig.templateId,
          user_id: emailConfig.publicKey,
          template_params: {
            to_email: email,
            to_name: nickname,
            otp_code: otpCode,
            app_name: 'Zest Tournament'
          }
        })
      });
      console.log('[OTP Service] Direct EmailJS dispatch completed.');
    } catch (emailErr) {
      console.warn('[OTP Service] Direct EmailJS dispatch failed:', emailErr);
    }
  }

  // 3. Direct Fast2SMS Delivery (if user configured Fast2SMS API Key for India SMS)
  const smsConfig = getSmsGatewayConfig();
  if (channel === 'phone' && smsConfig.fast2smsApiKey && phone) {
    try {
      const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
      console.log('[OTP Service] Sending direct SMS via Fast2SMS API to:', cleanPhone);
      await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': smsConfig.fast2smsApiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          route: 'otp',
          variables_values: otpCode,
          numbers: cleanPhone
        })
      });
      console.log('[OTP Service] Direct Fast2SMS dispatch completed.');
    } catch (smsErr) {
      console.warn('[OTP Service] Direct SMS dispatch failed:', smsErr);
    }
  }

  return { success: true, webhook: webhookResult };
};
