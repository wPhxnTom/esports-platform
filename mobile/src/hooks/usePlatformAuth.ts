import { useState, useCallback } from 'react';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import api from '../api/client';

WebBrowser.maybeCompleteAuthSession();

export function usePlatformAuth() {
  const [linkingPlatform, setLinkingPlatform] = useState<string | null>(null);

  const linkPlatform = useCallback(async (platform: string): Promise<boolean> => {
    setLinkingPlatform(platform);

    try {
      const res = await api.get(`/platform-auth/${platform}/start`);
      const data = res.data;

      if (data.manual) {
        setLinkingPlatform(null);
        return false;
      }

      if (!data.authUrl) {
        setLinkingPlatform(null);
        return false;
      }

      if (Platform.OS === 'web') {
        window.open(data.authUrl, '_blank');
        setLinkingPlatform(null);
        return true;
      }

      const result = await WebBrowser.openAuthSessionAsync(data.authUrl, data.authUrl);

      setLinkingPlatform(null);

      if (result.type === 'success') {
        return true;
      }

      return false;
    } catch (err: any) {
      setLinkingPlatform(null);
      if (err.response?.data?.manual) {
        return false;
      }
      throw err;
    }
  }, []);

  return { linkingPlatform, linkPlatform };
}
