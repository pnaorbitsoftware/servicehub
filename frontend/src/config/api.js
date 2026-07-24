const configuredApiUrl = String(import.meta.env.VITE_API_URL || "").trim();
const configuredSocketApiUrl = String(import.meta.env.VITE_SOCKET_API_URL || "").trim();
const productionBackendApiUrl = "https://all-in-one-services.onrender.com/api";

const fallbackApiUrl = "http://localhost:5000/api";
const productionSocketApiUrl = /^https?:\/\/(?:localhost|127\.0\.0\.1)(?=[:/]|$)/i.test(configuredSocketApiUrl)
  ? productionBackendApiUrl
  : configuredSocketApiUrl || productionBackendApiUrl;

// Production always uses the same-origin Vercel proxy. This intentionally
// ignores a stale VITE_API_URL left in Vercel, which previously pointed the
// browser directly at a CORS-broken backend deployment.
export const API_URL = (
  import.meta.env.PROD ? "/api" : configuredApiUrl || fallbackApiUrl
).replace(/\/+$/, "");
export const SOCKET_API_URL = String(
  import.meta.env.PROD ? productionSocketApiUrl : configuredSocketApiUrl || productionBackendApiUrl,
).replace(/\/+$/, "");

export const AUTH_API_URLS = [
  ...new Set([
    API_URL,
    ...(import.meta.env.DEV
      ? ["http://localhost:5000/api", "http://localhost:5001/api"]
      : []),
  ]),
];
