import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { router } from "expo-router";
import axiosInstance from "@/config/axios";
import { LoadingScreen } from "@/components/loading-screen";

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("devnikhil0306@gmail.com");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!email) {
      setError(t("auth.email_required"));
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      await axiosInstance.post("/users/forgot-password", { email });
      setSuccess(true);
    } catch (error: any) {
      setError(
        error.response?.data?.message || t("auth.forgot_password_error")
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("auth.forgot_password")}</Text>
      <Text style={styles.subtitle}>
        {t("auth.forgot_password_description")}
      </Text>

      {success ? (
        <View style={styles.successContainer}>
          <Text style={styles.successText}>{t("auth.reset_link_sent")}</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => router.replace("/login")}
          >
            <Text style={styles.buttonText}>{t("auth.back_to_login")}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <TextInput
            style={styles.input}
            placeholder={t("auth.email")}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity style={styles.button} onPress={handleSubmit}>
            <Text style={styles.buttonText}>{t("auth.send_reset_link")}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => router.back()}
          >
            <Text style={styles.linkText}>{t("auth.back_to_login")}</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    backgroundColor: "#1a1a1a",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#ffffff",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    color: "#a0a0a0",
    textAlign: "center",
  },
  input: {
    backgroundColor: "#2a2a2a",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    color: "#ffffff",
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  linkButton: {
    marginTop: 20,
    alignItems: "center",
  },
  linkText: {
    color: "#007AFF",
    fontSize: 16,
  },
  error: {
    color: "#ff3b30",
    marginBottom: 10,
    textAlign: "center",
  },
  successContainer: {
    alignItems: "center",
  },
  successText: {
    color: "#34c759",
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
});
