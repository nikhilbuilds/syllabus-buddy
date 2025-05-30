import { Platform } from "react-native";

// Use your machine's local IP address here
const DEV_API_URL = Platform.select({
  ios: "http://172.20.10.7:5000", // Your machine's IP address
  android: "http://172.20.10.7:5000", // Same IP for Android
  web: "http://172.20.10.7:5000", // Same IP for Web
});

export const API_URL = `${DEV_API_URL}/api/v1`;

// Let's see what this file contains
console.log("API_URL:", API_URL);
