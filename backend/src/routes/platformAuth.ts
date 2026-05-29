import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { prisma } from '../services/prisma';
import { getPlatformAuthUrl, handlePlatformCallback, linkPlatformAccount, getPlatformConfig } from '../services/platformAuth';

const router = Router();

router.get('/:platform/start', async (req, res, next) => {
  try {
    const { platform } = req.params;
    const { userId, redirectUri } = req.query;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ message: 'Missing userId' });
    }

    const state = jwt.sign({ userId, platform }, config.jwtSecret, { expiresIn: '5m' });

    const backendCallbackUrl = `${req.protocol}://${req.get('host')}/api/platform-auth/${platform}/callback`;

    const platformRedirect = req.query.redirectUri
      ? `${backendCallbackUrl}?state=${state}&app_redirect=${encodeURIComponent(req.query.redirectUri as string)}`
      : `${backendCallbackUrl}?state=${state}`;

    const cfg = getPlatformConfig(platform);
    if (!cfg) {
      return res.status(400).json({ message: `Platform ${platform} not supported` });
    }

    const apps = Object.keys({
      STEAM: 1, XBOX: 1, PSN: 1, BATTLE_NET: 1, ACTIVISION: 1,
    });
    if (!apps.includes(platform)) {
      return res.status(400).json({ message: 'Invalid platform' });
    }

    if (!cfg.clientId && platform !== 'STEAM') {
      return res.json({
        message: 'OAuth not configured',
        manual: true,
        platform,
        authUrl: null,
      });
    }

    const authUrl = getPlatformAuthUrl(platform, state, backendCallbackUrl);
    return res.json({ authUrl, manual: false });
  } catch (err) { next(err); }
});

router.get('/:platform/callback', async (req, res, next) => {
  try {
    const { platform } = req.params;
    const { code, state, 'openid.identity': openIdIdentity } = req.query;

    let userId: string;
    try {
      const decoded = jwt.verify(state as string, config.jwtSecret) as any;
      userId = decoded.userId;
    } catch {
      return res.status(401).send('<html><body><h2>Authentication failed: invalid state</h2></body></html>');
    }

    const backendCallbackUrl = `${req.protocol}://${req.get('host')}/api/platform-auth/${platform}/callback`;

    let platformId: string;
    let gamertag: string;

    if (platform === 'STEAM') {
      const claimedId = openIdIdentity as string;
      if (!claimedId) return res.status(400).send('<html><body><h2>Missing Steam identity</h2></body></html>');
      const result = await handlePlatformCallback(platform, claimedId, backendCallbackUrl);
      platformId = result.platformId;
      gamertag = result.gamertag;
    } else {
      const result = await handlePlatformCallback(platform, code as string, backendCallbackUrl);
      platformId = result.platformId;
      gamertag = result.gamertag;
    }

    await linkPlatformAccount(userId, platform, platformId, gamertag);

    const appRedirect = req.query.app_redirect as string;

    if (appRedirect) {
      return res.redirect(`${appRedirect}?platform=${platform}&gamertag=${encodeURIComponent(gamertag)}&success=true`);
    }

    res.send(`
      <html>
        <body style="display:flex;justify-content:center;align-items:center;height:100vh;background:#050508;color:white;font-family:sans-serif;flex-direction:column;gap:12px">
          <h1>✅ Account Linked!</h1>
          <p>${platform} — ${gamertag}</p>
          <p style="color:#94a3b8;font-size:14px">You can close this tab and return to PhxntomES.</p>
        </body>
      </html>
    `);
  } catch (err: any) {
    res.status(500).send(`<html><body style="display:flex;justify-content:center;align-items:center;height:100vh;background:#050508;color:white;font-family:sans-serif;flex-direction:column"><h2>❌ Error</h2><p>${err.message}</p></body></html>`);
  }
});

export default router;
