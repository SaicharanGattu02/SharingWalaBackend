import axios from 'axios';
import { API_CONFIG, tokenStorage } from './config.js';

/**
 * Standardized Central HTTP Client (Axios)
 */
export const httpClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

/**
 * Request Interceptor: Attach JWT Bearer Token if present
 */
httpClient.interceptors.request.use(
  (config) => {
    const token = tokenStorage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response Interceptor: Normalize and unwrap response
 * Automatically unwraps ApiResponse { data: ... }
 * Formats errors nicely so components can easily display `error.message`
 */
httpClient.interceptors.response.use(
  (response) => {
    // If backend returns standard ApiResponse: { statusCode, data, message, success }
    // We return the inner `data`, but keep message and statusCode accessible
    const responsePayload = response.data;
    if (responsePayload && typeof responsePayload === 'object' && 'data' in responsePayload) {
      return responsePayload.data;
    }
    return responsePayload;
  },
  (error) => {
    // Extract server-side ApiError message & validation fields
    const serverError = error.response?.data;
    const statusCode = error.response?.status || 500;

    let friendlyMessage = serverError?.message || error.message || 'Something went wrong';
    const validationErrors = serverError?.errors || [];

    // If validation errors exist, compile a clean readable string
    if (validationErrors.length > 0) {
      const detailed = validationErrors.map((e) => `${e.field}: ${e.message}`).join(', ');
      friendlyMessage = `${friendlyMessage} (${detailed})`;
    }

    // Auto-logout on 401 Unauthorized (optional callback or event dispatch)
    if (statusCode === 401) {
      tokenStorage.removeToken();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }
    }

    const normalizedError = new Error(friendlyMessage);
    normalizedError.statusCode = statusCode;
    normalizedError.errors = validationErrors;
    normalizedError.raw = error;

    return Promise.reject(normalizedError);
  }
);

export default httpClient;
