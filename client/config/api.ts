import { Platform } from "react-native";

// Use your machine's local IP address here
const DEV_API_URL = Platform.select({
  ios: `http://${process.env.EXPO_PUBLIC_LOCAL_IP_ADDRESS}:3000`, // Your machine's IP address
  android: `http://${process.env.EXPO_PUBLIC_LOCAL_IP_ADDRESS}:3000`, // Same IP for Android
  web: "https://api.syllabus.com", // Same IP for Web
});

export const API_URL = __DEV__
  ? `${DEV_API_URL}/api/v1`
  : `${"https://api.syllabus.com"}/api/v1`;
