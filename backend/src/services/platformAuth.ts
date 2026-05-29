import axios from 'axios';
import { prisma } from './prisma';
import { AppError } from '../middleware/errorHandler';

interface PlatformConfig {
  authorizeUrl: string;
  tokenUrl: string;
  clientId: string;
  clientSecret: string;
  scope: string;
  userInfoUrl?: string;
  getUserInfo: (accessToken: string, platformUserId?: string) => Promise<{ platformId: string; gamertag: string }>;
}

const PLATFORM_AUTH: Record<string, PlatformConfig> = {
  STEAM: {
    authorizeUrl: 'https://steamcommunity.com/openid/login',
    tokenUrl: '',
    clientId: process.env.STEAM_API_KEY || '',
    clientSecret: '',
    scope: '',
    getUserInfo: async (claimedId: string) => {
      const steamId = claimedId.split('/').pop() || claimedId;
      const key = process.env.STEAM_API_KEY;
      if (!key) throw new AppError(503, 'Steam API key not configured');
      const res = await axios.get(
        `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/`,
        { params: { key, steamids: steamId } }
      );
      const player = res.data?.response?.players?.[0];
      if (!player) throw new AppError(404, 'Steam profile not found');
      return { platformId: steamId, gamertag: player.personaname };
    },
  },
  XBOX: {
    authorizeUrl: 'https://login.live.com/oauth20_authorize.srf',
    tokenUrl: 'https://login.live.com/oauth20_token.srf',
    clientId: process.env.XBOX_CLIENT_ID || '',
    clientSecret: process.env.XBOX_CLIENT_SECRET || '',
    scope: 'Xboxlive.signin Xboxlive.offline_access',
    getUserInfo: async (accessToken: string) => {
      const res = await axios.post(
        'https://user.auth.xboxlive.com/user/authenticate',
        {
          Properties: { AuthMethod: 'RPS', RpsTicket: `d=${accessToken}` },
          RelyingParty: 'http://auth.xboxlive.com',
          TokenType: 'JWT',
        },
        { headers: { 'x-xbl-contract-version': '1' } }
      );
      const gamertag = res.data?.DisplayClaims?.xui?.[0]?.gt;
      const xuid = res.data?.DisplayClaims?.xui?.[0]?.xid || res.data?.DisplayClaims?.xui?.[0]?.uhs;
      return { platformId: xuid || accessToken, gamertag: gamertag || 'XboxPlayer' };
    },
  },
  PSN: {
    authorizeUrl: 'https://ca.account.sony.com/api/authz/v3/oauth/authorize',
    tokenUrl: 'https://ca.account.sony.com/api/authz/v3/oauth/token',
    clientId: process.env.PSN_CLIENT_ID || '',
    clientSecret: process.env.PSN_CLIENT_SECRET || '',
    scope: 'psn:profile.psnId',
    getUserInfo: async (accessToken: string) => {
      const res = await axios.get('https://us-prof.np.community.playstation.net/userProfile/v1/users/me/profile2', {
        params: { fields: 'onlineId,accountId' },
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const profile = res.data?.profile;
      return {
        platformId: profile?.accountId || accessToken,
        gamertag: profile?.onlineId || 'PSNPlayer',
      };
    },
  },
  BATTLE_NET: {
    authorizeUrl: 'https://oauth.battle.net/authorize',
    tokenUrl: 'https://oauth.battle.net/token',
    clientId: process.env.BATTLENET_CLIENT_ID || '',
    clientSecret: process.env.BATTLENET_CLIENT_SECRET || '',
    scope: 'openid wow.profile sc2.profile',
    getUserInfo: async (accessToken: string) => {
      const res = await axios.get('https://oauth.battle.net/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return {
        platformId: res.data?.id?.toString() || accessToken,
        gamertag: res.data?.battletag || res.data?.sub || 'BattleNetPlayer',
      };
    },
  },
  ACTIVISION: {
    authorizeUrl: 'https://s.activision.com/auth/authorize',
    tokenUrl: 'https://s.activision.com/auth/token',
    clientId: process.env.ACTIVISION_CLIENT_ID || '',
    clientSecret: process.env.ACTIVISION_CLIENT_SECRET || '',
    scope: 'openid profile',
    getUserInfo: async (accessToken: string) => {
      const res = await axios.get('https://profile.callofduty.com/cod/v1/user/identity', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = res.data;
      return {
        platformId: data?.uid || data?.id?.toString?.() || accessToken,
        gamertag: data?.username || data?.displayName || 'ActivisionPlayer',
      };
    },
  },
};

export function getPlatformAuthUrl(platform: string, state: string, redirectUri: string): string {
  const cfg = PLATFORM_AUTH[platform];
  if (!cfg) throw new AppError(400, `Platform ${platform} not supported`);

  if (platform === 'STEAM') {
    const params = new URLSearchParams({
      'openid.ns': 'http://specs.openid.net/auth/2.0',
      'openid.mode': 'checkid_setup',
      'openid.return_to': redirectUri,
      'openid.realm': redirectUri.split('?')[0],
      'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
      'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
    });
    return `${cfg.authorizeUrl}?${params.toString()}`;
  }

  const params = new URLSearchParams({
    client_id: cfg.clientId || 'missing_client_id',
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: cfg.scope,
    state,
  });
  return `${cfg.authorizeUrl}?${params.toString()}`;
}

export async function handlePlatformCallback(
  platform: string,
  code: string,
  redirectUri: string
): Promise<{ platformId: string; gamertag: string }> {
  const cfg = PLATFORM_AUTH[platform];
  if (!cfg) throw new AppError(400, `Platform ${platform} not supported`);

  let tokenData: any = {};
  let accessToken = code;

  if (platform === 'STEAM') {
    return cfg.getUserInfo(code);
  }

  if (cfg.tokenUrl && cfg.clientId) {
    const tokenRes = await axios.post(
      cfg.tokenUrl,
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: cfg.clientId,
        client_secret: cfg.clientSecret,
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    tokenData = tokenRes.data;
    accessToken = tokenData.access_token || code;
  }

  return cfg.getUserInfo(accessToken, tokenData?.id_token);
}

export async function linkPlatformAccount(
  userId: string,
  platform: string,
  platformId: string,
  gamertag: string
) {
  const existing = await prisma.platformLink.findUnique({
    where: { userId_platform: { userId, platform } },
  });
  if (existing) throw new AppError(409, 'Platform already linked');

  return prisma.platformLink.create({
    data: { userId, platform, gamertag, platformId },
  });
}

export function getPlatformConfig(platform: string) {
  return PLATFORM_AUTH[platform] || null;
}
