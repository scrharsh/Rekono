import { Platform } from 'react-native';

const configuredOrigin =
  process.env.REKONO_API_URL?.trim().replace(/\/+$/, '') ||
  process.env.EXPO_PUBLIC_REKONO_API_URL?.trim().replace(/\/+$/, '');

const localOrigin = Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
const productionFallbackOrigin = 'https://rekono-backend.onrender.com';

export const API_ORIGIN = configuredOrigin || (__DEV__ ? localOrigin : productionFallbackOrigin);
export const API_URL = `${API_ORIGIN}/v1`;
