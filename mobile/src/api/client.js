import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'legacy_odyssey_token';

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

// Request interceptor to attach Bearer token
client.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      // SecureStore may not be available in all environments
      console.warn('SecureStore read error:', err.message);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for consistent error handling
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const message =
        error.response.data?.error ||
        error.response.data?.message ||
        `Request failed with status ${error.response.status}`;
      const apiError = new Error(message);
      apiError.status = error.response.status;
      apiError.data = error.response.data;
      return Promise.reject(apiError);
    }
    if (error.request) {
      return Promise.reject(new Error('Network error. Please check your connection.'));
    }
    return Promise.reject(error);
  }
);

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
