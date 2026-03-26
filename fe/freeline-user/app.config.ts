import type { ConfigContext, ExpoConfig } from 'expo/config';

const API_BASE_URL = process.env.API_URL ?? 'https://j14a207.p.ssafy.io/api/v1';
const EAS_PROJECT_ID =
  process.env.EAS_PROJECT_ID ?? 'fd7bcea8-fc0c-472a-b727-f42b1795c5a9';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Freeline',
  slug: 'freeline',
  scheme: 'freeline',
  ios: {
    ...config.ios,
    bundleIdentifier: 'com.freeline.user',
  },
  android: {
    ...config.android,
    package: 'freeline_user.app',
    googleServicesFile: './google-services.json',
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
