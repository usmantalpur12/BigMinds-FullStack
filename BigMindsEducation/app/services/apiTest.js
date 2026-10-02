// Test API connection
import { backendAPI } from "./backendAPI";

export const testAPIConnection = async () => {
  try {
    console.log("Testing API connection...");
    const response = await backendAPI.get("/health");
    console.log("API Health Check:", response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error("API Connection Error:", error.message);
    return { success: false, error: error.message };
  }
};

export const testLogin = async (email, password) => {
  try {
    console.log("Testing login with:", email);
    const response = await backendAPI.post("/auth/login", { email, password });
    console.log("Login Response:", response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Login Error:", error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
};
