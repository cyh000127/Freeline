import type { ConfigContext, ExpoConfig } from 'expo/config';

const API_BASE_URL = process.env.API_URL ?? 'https://j14a207.p.ssafy.io/api/v1';
const EAS_PROJECT_ID = process.env.EAS_PROJECT_ID ?? '';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Freeline',
  slug: 'freeline-user',
  scheme: 'freeline',
  ios: {
    ...config.ios,
    bundleIdentifier: 'com.freeline.user',
  },
  android: {
    ...config.android,
    package: 'com.freeline.user',
  },
  extra: {
    ...config.extra,
    apiBaseUrl: API_BASE_URL,
    eas: {
      projectId: EAS_PROJECT_ID,
    },
  },
  runtimeVersion: '1.0.0',
});
