import { Platform } from 'react-native';

const configuredOrigin =
  process.env.REKONO_API_URL?.trim().replace(/\/+$/, '') ||
  process.env.EXPO_PUBLIC_REKONO_API_URL?.trim().replace(/\/+$/, '');

const productionFallbackOrigin = 'https://rekono-backend.onrender.com';

// React Native runtime env injection is not guaranteed in debug builds.
// Keep production backend as the safe default and use env vars to force local API.
const localOverrideHint = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';

export const API_ORIGIN = configuredOrigin || productionFallbackOrigin;
export const API_URL = `${API_ORIGIN}/v1`;

// Exported for debugging in case local override is needed from env.
export const LOCAL_API_OVERRIDE_HINT = localOverrideHint;
