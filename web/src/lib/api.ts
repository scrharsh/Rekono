const rawApiUrl = process.env.NEXT_PUBLIC_API_URL;
const normalizedApiUrl = rawApiUrl?.replace(/\/+$/, '');

if (!normalizedApiUrl && process.env.NODE_ENV === 'production') {
  throw new Error('NEXT_PUBLIC_API_URL must be configured in production.');
}

const resolvedApiUrl = normalizedApiUrl || 'http://localhost:3000';

export const API_URL = resolvedApiUrl;
export const API_V1_URL = `${resolvedApiUrl}/v1`;