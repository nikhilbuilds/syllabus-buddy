import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import onboardingService from "../services/onboardingService";
import { useAuth } from "../context/auth";

export default function VerifyEmailScreen() {
  const { token } = useLocalSearchParams();
  const { user, resendVerification } = useAuth();
  const [status, setStatus] = useState<"verifying" | "success" | "error">(
    "verifying"
  );

  useEffect(() => {
    if (token) {
      handleVerification(token as string);
    } else {
      setStatus("error");
    }
  }, [token]);

  const handleVerification = async (verificationToken: string) => {
    try {
      const response = await onboardingService.verifyEmail({
        token: verificationToken,
      });
      setStatus("success");

      // Redirect to main app since user is now verified
      //   setTimeout(() => {
      //     router.replace("/(tabs)");
      //   }, 2000);
    } catch (error: any) {
      console.error("Verification error:", error);
      setStatus("error");
    }
  };

  const renderContent = () => {
    switch (status) {
      case "verifying":
        return (
          <View style={styles.statusContainer}>
            <ActivityIndicator size="large" color="#007bff" />
            <Text style={styles.statusText}>Verifying your email...</Text>
          </View>
        );

      case "success":
        return (
          <View style={styles.statusContainer}>
            <Text style={styles.successIcon}>✅</Text>
            <Text style={styles.successText}>Email Verified!</Text>
            <Text style={styles.statusText}>
              Welcome to StudyApp! Redirecting...
            </Text>
          </View>
        );

      case "error":
        return (
          <View style={styles.statusContainer}>
            <Text style={styles.errorIcon}>❌</Text>
            <Text style={styles.errorText}>Verification Failed</Text>
            <Text style={styles.statusText}>
              The verification link may be invalid or expired.
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => router.replace("/(tabs)")}
            >
              <Text style={styles.retryButtonText}>Continue to App</Text>
            </TouchableOpacity>
          </View>
        );
    }
  };

  return <View style={styles.container}>{renderContent()}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    padding: 20,
  },
  statusContainer: {
    alignItems: "center",
  },
  statusText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 16,
  },
  successIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  successText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#28a745",
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#dc3545",
  },
  retryButton: {
    backgroundColor: "#007bff",
    borderRadius: 8,
    padding: 16,
    marginTop: 20,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
