/**
 * Vercel Serverless Function to proxy Gmail OTP dispatch
 * Handles both:
 *  1. Google Apps Script Web App forwarding (bypasses browser CORS)
 *  2. Direct Gmail REST API message dispatch
 */
export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let payload = req.body;
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch (_) {}
    }

    const { mode, scriptUrl, raw, to, nickname, otpCode, subject, html, text, clientId, clientSecret, refreshToken } = payload || {};
    let accessToken = payload?.accessToken;

    // 1. Google Apps Script Proxy
    if (mode === 'appscript' || scriptUrl) {
      if (!scriptUrl) {
        return res.status(400).json({ error: 'Missing scriptUrl' });
      }

      const scriptRes = await fetch(scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to,
          nickname,
          otpCode,
          subject,
          html,
          text
        })
      });

      const scriptData = await scriptRes.json().catch(() => ({}));
      return res.status(200).json({
        success: true,
        data: scriptData,
        id: `gas_${Date.now()}`
      });
    }

    // 2. Direct Gmail REST API Proxy
    if (refreshToken && clientId && clientSecret) {
      try {
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken,
            grant_type: 'refresh_token'
          }).toString()
        });
        const tokenData = await tokenRes.json().catch(() => ({}));
        if (tokenData.access_token) {
          accessToken = tokenData.access_token;
        }
      } catch (tokenErr) {
        console.warn('[Vercel Gmail API] Token refresh warning:', tokenErr);
      }
    }

    if (!accessToken) {
      return res.status(401).json({ error: 'Missing Gmail access token' });
    }

    const gmailRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ raw })
    });

    const gmailData = await gmailRes.json().catch(() => ({}));
    return res.status(gmailRes.status).json(gmailData);

  } catch (err) {
    console.error('[Vercel Gmail Proxy Error]:', err);
    return res.status(500).json({ error: err.message });
  }
}
