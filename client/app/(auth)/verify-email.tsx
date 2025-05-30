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
import onboardingService from "../../services/onboardingService";
import { useAuth } from "../../context/auth";

export default function VerifyEmailScreen() {
  const { token } = useLocalSearchParams();
  console.log("AUTH GROUP verify-email - token:", token);
  const { user, resendVerification } = useAuth();
  const [status, setStatus] = useState<
    "verifying" | "success" | "error" | "waiting"
  >("waiting");
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (token) {
      handleVerification(token as string);
    }
  }, [token]);

  console.log("verificationToken", token);

  const handleVerification = async (verificationToken: string) => {
    try {
      await onboardingService.verifyEmail({ token: verificationToken });
      setStatus("success");

      // Redirect to main app since user is now verified
      setTimeout(() => {
        router.replace("/(tabs)");
      }, 2000);
    } catch (error: any) {
      setStatus("error");
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await resendVerification();
      Alert.alert(
        "Email Sent",
        "A new verification email has been sent to your inbox."
      );
    } catch (error) {
      Alert.alert(
        "Error",
        "Failed to send verification email. Please try again."
      );
    } finally {
      setResending(false);
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
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => router.replace("/(tabs)")}
            >
              <Text style={styles.retryButtonText}>Continue to App</Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return (
          <View style={styles.statusContainer}>
            <Text style={styles.title}>Check Your Email</Text>
            <Text style={styles.subtitle}>
              We've sent a verification link to {user?.email}. Click the link in
              your email to verify your account.
            </Text>

            <TouchableOpacity
              style={[styles.resendButton, resending && styles.buttonDisabled]}
              onPress={handleResend}
              disabled={resending}
            >
              <Text style={styles.resendButtonText}>
                {resending ? "Sending..." : "Resend Verification Email"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.push("/login")}
            >
              <Text style={styles.backButtonText}>Back to Login</Text>
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
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 24,
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
  backButton: {
    alignItems: "center",
    marginTop: 20,
  },
  backButtonText: {
    color: "#007bff",
    fontSize: 16,
  },
  resendButton: {
    backgroundColor: "#007bff",
    borderRadius: 8,
    padding: 16,
    marginTop: 20,
    marginBottom: 10,
  },
  resendButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
});
