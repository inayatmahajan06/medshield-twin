/**
 * config.js
 * ---------
 * Helper utility for building API URLs with VITE_API_URL environment variable support.
 * Ensures local dev proxy and deployed environments (Vercel, custom backend host) work seamlessly.
 *
 * Local Dev:  VITE_API_URL is unset → returns relative path (e.g. "/api/devices")
 *             → Vite dev-server proxy forwards /api/* to http://127.0.0.1:5000
 * Production: Set VITE_API_URL=https://your-backend.com in .env and deployed env vars.
 */

export const getApiUrl = (endpoint = '') => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const envUrl = (import.meta.env.VITE_API_URL || '').trim();

  if (envUrl) {
    const baseUrl = envUrl.endsWith('/') ? envUrl.slice(0, -1) : envUrl;
    return `${baseUrl}${cleanEndpoint}`;
  }

  // In development, use relative paths so the Vite proxy (/api → localhost:5000) works.
  // In production builds without VITE_API_URL, fall back to same-origin.
  return cleanEndpoint;
};
