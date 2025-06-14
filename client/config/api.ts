import { Platform } from "react-native";

let url = "htttps://api.syllabusbuddy.com/api/v1";
//http://${process.env.EXPO_PUBLIC_LOCAL_IP_ADDRESS}:3000
// Use your machine's local IP address here
const DEV_API_URL = Platform.select({
  ios: url, // Your machine's IP address
  android: url, // Same IP for Android
  web: url, // Same IP for Web
});

console.log("DEV_API_URL", DEV_API_URL);

export const API_URL = url;

// export const API_URL = __DEV__ ? `${DEV_API_URL}/api/v1` : `url`;
