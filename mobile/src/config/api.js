import { Platform } from "react-native";

export const PRODUCTION_BACKEND_API_URL = "https://servicehub-cdt9.onrender.com/api";
export const SHARED_BACKEND_API_URL = "http://192.168.1.26:5000/api";
export const ANDROID_EMULATOR_BACKEND_API_URL = "http://10.0.2.2:5000/api";

function normalizeApiUrl(url = PRODUCTION_BACKEND_API_URL) {
  let trimmedUrl = String(url || PRODUCTION_BACKEND_API_URL).trim().replace(/\/$/, "");

  if (trimmedUrl && !/\/api(?:\/|$)/i.test(trimmedUrl)) {
    trimmedUrl = `${trimmedUrl}/api`;
  }

  if (Platform.OS === "android") {
    return trimmedUrl.replace(
      /^http:\/\/(localhost|127\.0\.0\.1)(?=[:/]|$)/i,
      "http://10.0.2.2"
    );
  }

  return trimmedUrl;
}

const isDev = typeof __DEV__ !== "undefined" && __DEV__;

export const API_URL = normalizeApiUrl(
  process.env.EXPO_PUBLIC_API_URL || PRODUCTION_BACKEND_API_URL
);

export const API_URL_CANDIDATES = (isDev
  ? [
      API_URL,
      normalizeApiUrl(PRODUCTION_BACKEND_API_URL),
      normalizeApiUrl(SHARED_BACKEND_API_URL),
      Platform.OS === "android"
        ? normalizeApiUrl(ANDROID_EMULATOR_BACKEND_API_URL)
        : "",
    ]
  : [
      normalizeApiUrl(PRODUCTION_BACKEND_API_URL),
      API_URL,
    ]
).filter((url, index, urls) => url && urls.indexOf(url) === index);