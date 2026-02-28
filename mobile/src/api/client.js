import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'legacy_odyssey_token';
const REFRESH_KEY = 'legacy_odyssey_refresh';
const FAMILY_ID_KEY = 'legacy_odyssey_family_id';

// Base URL: use environment variable or fallback to production Railway URL
const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  process.env.API_URL ||
  'https://legacy-odyssey-production-a9d1.up.railway.app';

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Track whether a refresh is in progress to avoid concurrent refresh calls
let isRefreshing = false;
let refreshSubscribers = [];

function onTokenRefreshed(newToken) {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb) {
  refreshSubscribers.push(cb);
}

// Request interceptor to attach Bearer token and active family ID
client.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      // Send active family ID so the server knows which book to use
      const familyId = await SecureStore.getItemAsync(FAMILY_ID_KEY);
      if (familyId) {
        config.headers['X-Family-Id'] = familyId;
      }
    } catch (err) {
      // SecureStore may not be available in all environments
      console.warn('SecureStore read error:', err.message);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — auto-refresh on 401
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If we get a 401 and haven't retried yet, try refreshing the token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Don't try to refresh the /api/auth/refresh call itself
      if (originalRequest.url?.includes('/api/auth/refresh') ||
          originalRequest.url?.includes('/api/auth/login')) {
        return Promise.reject(formatError(error));
      }

      if (isRefreshing) {
        // Another refresh is in progress — wait for it
        return new Promise((resolve, reject) => {
          addRefreshSubscriber((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(client(originalRequest));
          });
        });
      }

      isRefreshing = true;

      try {
        const refreshToken = await SecureStore.getItemAsync(REFRESH_KEY);
        if (!refreshToken) {
          isRefreshing = false;
          return Promise.reject(formatError(error));
        }

        // Call refresh endpoint directly (bypass interceptor to avoid loops)
        const res = await axios.post(`${BASE_URL}/api/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { session } = res.data;
        if (!session?.access_token) {
          isRefreshing = false;
          return Promise.reject(formatError(error));
        }

        // Store new tokens
        await SecureStore.setItemAsync(TOKEN_KEY, session.access_token);
        if (session.refresh_token) {
          await SecureStore.setItemAsync(REFRESH_KEY, session.refresh_token);
        }

        isRefreshing = false;
        onTokenRefreshed(session.access_token);

        // Retry the original request with the new token
        originalRequest.headers.Authorization = `Bearer ${session.access_token}`;
        return client(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        refreshSubscribers = [];
        // Refresh failed — user needs to log in again
        return Promise.reject(formatError(error));
      }
    }

    return Promise.reject(formatError(error));
  }
);

function formatError(error) {
  if (error.response) {
    const message =
      error.response.data?.error ||
      error.response.data?.message ||
      `Request failed with status ${error.response.status}`;
    const apiError = new Error(message);
    apiError.status = error.response.status;
    apiError.data = error.response.data;
    return apiError;
  }
  if (error.request) {
    return new Error('Network error. Please check your connection.');
  }
  return error;
}

/**
 * Store the auth token in SecureStore and update default headers.
 */
export async function setToken(token) {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch (err) {
    console.warn('SecureStore write error:', err.message);
  }
}

/**
 * Remove the auth token from SecureStore and clear default headers.
 */
export async function clearToken() {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch (err) {
    console.warn('SecureStore delete error:', err.message);
  }
}

/**
 * Get the stored token (for auth context initialization).
 */
export async function getToken() {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (err) {
    console.warn('SecureStore read error:', err.message);
    return null;
  }
}

/**
 * Set the active family ID (for multi-book support).
 */
export async function setActiveFamilyId(familyId) {
  try {
    if (familyId) {
      await SecureStore.setItemAsync(FAMILY_ID_KEY, familyId);
    } else {
      await SecureStore.deleteItemAsync(FAMILY_ID_KEY);
    }
  } catch (err) {
    console.warn('SecureStore family write error:', err.message);
  }
}

/**
 * Get the stored active family ID.
 */
export async function getActiveFamilyId() {
  try {
    return await SecureStore.getItemAsync(FAMILY_ID_KEY);
  } catch (err) {
    return null;
  }
}

// Convenience methods
export function get(url, config) {
  return client.get(url, config);
}

export function post(url, data, config) {
  return client.post(url, data, config);
}

export function put(url, data, config) {
  return client.put(url, data, config);
}

export function del(url, config) {
  return client.delete(url, config);
}

export { BASE_URL };
export default client;
