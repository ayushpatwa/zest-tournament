import crypto from 'crypto';

/**
 * Signs an RS256 JWT assertion for Google OAuth 2.0
 */
function createSignedJwt(clientEmail, privateKey) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };

  const encHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encClaim = Buffer.from(JSON.stringify(claim)).toString('base64url');
  const unsignedToken = `${encHeader}.${encClaim}`;

  const sign = crypto.createSign('RSA-SHA256');
  sign.update(unsignedToken);
  const signature = sign.sign(privateKey, 'base64url');

  return `${unsignedToken}.${signature}`;
}

/**
 * Exchanges signed JWT for Google OAuth2 Bearer Access Token
 */
async function getGoogleAccessToken(clientEmail, privateKey) {
  const jwt = createSignedJwt(clientEmail, privateKey);
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    }).toString()
  });

  const tokenData = await tokenRes.json();
  if (!tokenRes.ok || !tokenData.access_token) {
    throw new Error(tokenData.error_description || tokenData.error || 'Failed to obtain Google access token');
  }
  return tokenData.access_token;
}

/**
 * Vercel Serverless Function: Dispatch FCM Push Notifications to Closed Android Devices
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
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { title, message, tokens, serviceAccount, extra = {} } = body;

    const notifTitle = String(title || '⚡ ZEST TOURNAMENT').trim();
    const notifBody = String(message || body.body || '').trim();
    const tokenList = Array.isArray(tokens) ? tokens.filter(t => typeof t === 'string' && t.trim().length > 10) : [];

    if (tokenList.length === 0) {
      return res.status(400).json({ error: 'No valid device tokens provided for dispatch' });
    }

    // 1. Resolve Service Account
    let sa = serviceAccount;
    if (!sa && process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      } catch (_) {
        sa = process.env.FIREBASE_SERVICE_ACCOUNT;
      }
    }

    if (typeof sa === 'string') {
      try {
        sa = JSON.parse(sa);
      } catch (parseErr) {
        return res.status(400).json({ error: 'Invalid Firebase Service Account JSON format' });
      }
    }

    if (!sa || !sa.client_email || !sa.private_key) {
      return res.status(400).json({ 
        error: 'Missing Firebase Service Account credentials. Please paste your Firebase Service Account JSON in Admin Panel or set FIREBASE_SERVICE_ACCOUNT in Vercel.',
        requiresServiceAccount: true
      });
    }

    const projectId = sa.project_id || 'zest-app-fc25b';
    const clientEmail = sa.client_email;
    let privateKey = sa.private_key;

    // Handle escaped newlines in private key string
    if (privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }

    // 2. Obtain Google OAuth 2.0 Access Token
    const accessToken = await getGoogleAccessToken(clientEmail, privateKey);

    // 3. Dispatch to all device tokens via Google FCM HTTP v1 API
    const fcmEndpoint = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

    let successCount = 0;
    let failedCount = 0;
    const errors = [];

    // Process in batches of 20 concurrent requests
    const BATCH_SIZE = 20;
    for (let i = 0; i < tokenList.length; i += BATCH_SIZE) {
      const slice = tokenList.slice(i, i + BATCH_SIZE);
      const promises = slice.map(async (token) => {
        try {
          const fcmPayload = {
            message: {
              token: token,
              notification: {
                title: notifTitle,
                body: notifBody
              },
              android: {
                priority: 'high',
                notification: {
                  channel_id: 'zest_alerts',
                  sound: 'default',
                  default_sound: true,
                  default_vibrate_timings: true,
                  notification_priority: 'PRIORITY_MAX'
                }
              },
              data: {
                title: notifTitle,
                body: notifBody,
                tournamentId: String(extra.tournamentId || extra.targetTournamentId || ''),
                type: String(extra.type || 'announcement')
              }
            }
          };

          const fcmRes = await fetch(fcmEndpoint, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(fcmPayload)
          });

          const fcmData = await fcmRes.json();
          if (fcmRes.ok) {
            successCount++;
          } else {
            failedCount++;
            errors.push({ token: token.slice(0, 15) + '...', error: fcmData.error?.message || 'FCM error' });
          }
        } catch (dispatchErr) {
          failedCount++;
          errors.push({ token: token.slice(0, 15) + '...', error: dispatchErr.message });
        }
      });

      await Promise.allSettled(promises);
    }

    return res.status(200).json({
      success: successCount > 0,
      totalTokens: tokenList.length,
      sentCount: successCount,
      failedCount: failedCount,
      error: (failedCount > 0 && successCount === 0) ? (errors[0]?.error || 'Failed to dispatch push') : undefined,
      errors: errors.slice(0, 5)
    });

  } catch (err) {
    console.error('[API Send Push Error]:', err);
    return res.status(500).json({ error: err.message });
  }
}