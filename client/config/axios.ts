import axios from "axios";
import { API_URL } from "./api";
import { router } from "expo-router";

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // This is important for sending/receiving cookies
});

// Response interceptor to handle unauthorized responses
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login on unauthorized
      console.log("Authentication error, redirecting to login");

      router.replace("/login");
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
