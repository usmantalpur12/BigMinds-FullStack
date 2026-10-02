import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import Constants from "expo-constants";

function getBaseURL() {
  const port = 5000;
  if (__DEV__) {
    // Attempt to get the IP address from Expo's dev server hostname
    const debuggerHost = Constants.expoConfig?.hostUri;
    if (debuggerHost) {
      // Extract IP address from the host string (e.g. 192.168.1.5:8081 -> 192.168.1.5)
      const ipAddress = debuggerHost.split(':')[0];
      return `http://${ipAddress}:${port}/api`;
    }
    
    // Fallback if host parsing fails
    if (Platform.OS === "android") {
      // 10.0.2.2 is the special alias to your host loopback interface in the Android emulator
      return `http://10.0.2.2:${port}/api`;
    }
    return `http://localhost:${port}/api`;
  }
  // This is your live Vercel URL
  return "https://bigminds-api.vercel.app/api";
}

const backendAPI = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000, // Increased timeout to 30 seconds
  headers: {
    "Content-Type": "application/json",
  },
});

// Log base URL on initialization
console.log("🔗 Backend API Base URL:", getBaseURL());

backendAPI.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (token) {
        config.headers.Authorization = "Bearer " + token;
      }
    } catch (error) {
      console.error("Error getting token:", error);
    }

    // Log request for debugging
    if (__DEV__) {
      console.log(`📤 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }

    return config;
  },
  (error) => {
    console.error("❌ Request Error:", error);
    return Promise.reject(error);
  }
);

backendAPI.interceptors.response.use(
  (response) => {
    // Log successful response for debugging
    if (__DEV__) {
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    }
    return response;
  },
  async (error) => {
    // Enhanced error handling with detailed messages
    let errorMessage = "Network error occurred";

    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const data = error.response.data;

      console.error(`❌ API Error Response: ${status} - ${error.config?.url}`);
      console.error("Error Data:", data);

      if (status === 401) {
        // Token expired or invalid
        try {
          await AsyncStorage.removeItem("authToken");
          await AsyncStorage.removeItem("userData");

          // Check if error message indicates token expiration
          const errorMessage = data?.message || "";
          if (errorMessage.includes("expired") || errorMessage.includes("Token expired")) {
            // Redirect to login with expiration message
            const { router } = require("expo-router");
            router.replace("/auth/login?expired=true");
          } else {
            // Other 401 errors - redirect to login
            const { router } = require("expo-router");
            router.replace("/auth/login");
          }
        } catch (e) {
          console.error("Error clearing storage:", e);
        }

        errorMessage = data?.message || "Authentication failed. Please login again.";
      } else if (status === 400) {
        errorMessage = data?.message || "Invalid request. Please check your input.";
      } else if (status === 404) {
        errorMessage = "Endpoint not found. Please check the API configuration.";
      } else if (status === 500) {
        errorMessage = "Server error. Please try again later.";
      } else {
        errorMessage = data?.message || `Server error (${status})`;
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error("❌ Network Error: No response received");
      console.error("Request URL:", error.config?.url);
      console.error("Base URL:", error.config?.baseURL);

      if (error.code === "ECONNABORTED") {
        errorMessage = "Request timeout. Please check your internet connection and try again.";
      } else if (error.code === "ECONNREFUSED") {
        errorMessage = `Cannot connect to server. Please ensure the backend server is running at ${getBaseURL()}`;
      } else if (error.code === "ENOTFOUND" || error.code === "EAI_AGAIN") {
        errorMessage = "DNS lookup failed. Please check your internet connection.";
      } else if (error.message?.includes("Network Error")) {
        errorMessage = `Network error: Cannot reach server at ${getBaseURL()}. Please check:\n1. Backend server is running\n2. Correct IP address/port\n3. Device and server are on same network`;
      } else {
        errorMessage = `Network error: ${error.message || "Unable to connect to server"}`;
      }
    } else {
      // Something else happened
      console.error("❌ Request Setup Error:", error.message);
      errorMessage = error.message || "An unexpected error occurred";
    }

    // Create enhanced error object
    const enhancedError = {
      ...error,
      message: errorMessage,
      isNetworkError: !error.response && !!error.request,
      isTimeout: error.code === "ECONNABORTED",
      isConnectionRefused: error.code === "ECONNREFUSED",
    };

    return Promise.reject(enhancedError);
  }
);

const getFullUrl = (path: string | null | undefined) => {
  if (!path) return null;
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  
  // Extract the root server URL (e.g., http://ip:5000 from http://ip:5000/api)
  const baseUrl = getBaseURL().replace('/api', '');
  
  // Ensure we don't have double slashes
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};

export { backendAPI, getBaseURL, getFullUrl };
