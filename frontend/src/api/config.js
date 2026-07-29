/**
 * config.js
 * ---------
 * Helper utility for building API URLs with VITE_API_URL environment variable support.
 * Ensures local dev proxy and deployed environments (Vercel, custom backend host) work seamlessly.
 */

export const getApiUrl = (endpoint = '') => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const envUrl = (import.meta.env.VITE_API_URL || '').trim();

  if (envUrl) {
    const baseUrl = envUrl.endsWith('/') ? envUrl.slice(0, -1) : envUrl;
    return `${baseUrl}${cleanEndpoint}`;
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${cleanEndpoint}`;
  }

  return cleanEndpoint;
};
