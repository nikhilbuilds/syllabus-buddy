import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import axiosInstance from "@/config/axios";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export class NotificationService {
  static async registerForPushNotifications(): Promise<string | null> {
    let token = null;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    console.log("Device.isDevice:==========>", Device.isDevice);

    if (Device.isDevice) {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();

      let finalStatus = existingStatus;

      console.log("existingStatus:==========>", existingStatus);

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;

        console.log("status:==========>", status);
      }

      if (finalStatus !== "granted") {
        alert("Failed to get push token for push notification!");
        return null;
      }

      token = (await Notifications.getExpoPushTokenAsync()).data;

      console.log("Push token:==========>", token);

      // Save token to server
      try {
        await axiosInstance.post("/test/save-push-token", { token });
        console.log("Push token saved to server");
      } catch (error) {
        console.error("Failed to save push token:==========>", error);
      }
    } else {
      alert("Must use physical device for Push Notifications");
    }

    return token;
  }

  static setupNotificationListeners() {
    // Handle notification received while app is in foreground
    Notifications.addNotificationReceivedListener((notification) => {
      console.log("Notification received:", notification);
    });

    // Handle notification tapped
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log("Notification tapped:", response);
    });
  }

  // static async regeneratePushToken(): Promise<string | null> {
  //   try {
  //     console.log("Regenerating push token...");

  //     if (!Device.isDevice) {
  //       console.log("Must use physical device for Push Notifications");
  //       return null;
  //     }

  //     // Request permissions again
  //     const { status } = await Notifications.requestPermissionsAsync();
  //     if (status !== "granted") {
  //       alert("Push notification permissions required!");
  //       return null;
  //     }

  //     // Generate new token
  //     const token = (await Notifications.getExpoPushTokenAsync()).data;

  //     console.log("New push token:==========>", token);

  //     // Save new token to server
  //     try {
  //       await axiosInstance.post("/test/save-push-token", { token });
  //       console.log("New push token saved to server");
  //     } catch (error) {
  //       console.error("Failed to save new push token:==========>", error);
  //     }

  //     return token;
  //   } catch (error) {
  //     console.error("Error regenerating push token:", error);
  //     return null;
  //   }
  // }

  // static async clearAndRegenerateToken(): Promise<string | null> {
  //   try {
  //     // Clear existing permissions (this will force re-request)
  //     console.log("Clearing existing permissions...");

  //     // Generate new token
  //     const token = await this.regeneratePushToken();

  //     return token;
  //   } catch (error) {
  //     console.error("Error clearing and regenerating token:", error);
  //     return null;
  //   }
  // }

  // static async getTokenInfo(): Promise<void> {
  //   try {
  //     const permissions = await Notifications.getPermissionsAsync();
  //     console.log("Current permissions:", permissions);

  //     if (Device.isDevice && permissions.status === "granted") {
  //       const token = (
  //         await Notifications.getExpoPushTokenAsync({
  //           projectId: Constants.expoConfig?.extra?.eas?.projectId,
  //         })
  //       ).data;

  //       console.log("Current token:", token);
  //       console.log("Project ID:", Constants.expoConfig?.extra?.eas?.projectId);
  //     }
  //   } catch (error) {
  //     console.error("Error getting token info:", error);
  //   }
  // }
}
