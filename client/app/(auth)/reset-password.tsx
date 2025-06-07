import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { router, useLocalSearchParams } from "expo-router";
import axiosInstance from "@/config/axios";
import { LoadingScreen } from "@/components/loading-screen";

export default function ResetPasswordScreen() {
  const { t } = useTranslation();
  const { token } = useLocalSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!password || !confirmPassword) {
      setError(t("auth.password_required"));
      return;
    }

    if (password.length < 8) {
      setError(t("auth.password_min_length"));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("auth.password_mismatch"));
      return;
    }

    setLoading(true);
    setError("");

    try {
      await axiosInstance.post("/users/reset-password", {
        token,
        password,
      });
      setSuccess(true);
    } catch (error: any) {
      setError(error.response?.data?.message || t("auth.reset_password_error"));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("auth.reset_password")}</Text>

      {success ? (
        <View style={styles.successContainer}>
          <Text style={styles.successText}>{t("auth.reset_success")}</Text>
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
            placeholder={t("auth.new_password")}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TextInput
            style={styles.input}
            placeholder={t("auth.confirm_password")}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity style={styles.button} onPress={handleSubmit}>
            <Text style={styles.buttonText}>{t("auth.reset_password")}</Text>
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
    marginBottom: 30,
    color: "#ffffff",
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
