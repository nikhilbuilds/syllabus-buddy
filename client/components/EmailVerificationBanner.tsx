import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useAuth } from "../context/auth";

export function EmailVerificationBanner() {
  const { user, resendVerification } = useAuth();
  const [resending, setResending] = useState(false);

  if (!user || user.isEmailVerified) {
    return null;
  }

  const handleResend = async () => {
    setResending(true);
    try {
      await resendVerification();
      Alert.alert("Email Sent", "A new verification email has been sent!");
    } catch (error) {
      Alert.alert("Error", "Failed to send email. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>
        📧 Please verify your email to unlock all features
      </Text>
      <TouchableOpacity
        style={[styles.button, resending && styles.buttonDisabled]}
        onPress={handleResend}
        disabled={resending}
      >
        <Text style={styles.buttonText}>
          {resending ? "Sending..." : "Resend"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: "#fff3cd",
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#ffeaa7",
  },
  text: {
    flex: 1,
    color: "#856404",
    fontSize: 14,
  },
  button: {
    backgroundColor: "#ffc107",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  buttonText: {
    color: "#212529",
    fontSize: 12,
    fontWeight: "600",
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
});
