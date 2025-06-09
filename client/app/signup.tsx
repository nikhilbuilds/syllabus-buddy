import React, { useState } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Text,
  Image,
} from "react-native";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { darkTheme } from "@/constants/theme";

WebBrowser.maybeCompleteAuthSession();

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [_, googleResponse, googlePromptAsync] = Google.useAuthRequest({
    clientId:
      "747037507479-19tl1fhdil7finkaib61u7j4s827vv4o.apps.googleusercontent.com",
    androidClientId: "YOUR_ANDROID_CLIENT_ID",
    iosClientId: "YOUR_IOS_CLIENT_ID",
  });

  const handleSignup = async () => {
    if (password !== confirmPassword) {
      alert("Passwords don't match!");
      return;
    }

    try {
      const response = await axios.post("YOUR_BACKEND_URL/auth/signup", {
        email,
        password,
      });

      if (response.status === 200) {
        await SecureStore.setItemAsync("authToken", response.data.token);
        router.replace("/(tabs)");
      }
    } catch (error) {
      console.error("Signup error:", error);
      alert("Signup failed. Please try again.");
    }
  };

  const handleGoogleSignup = async () => {
    try {
      const result = await googlePromptAsync();
      if (result?.type === "success" && result.authentication) {
        const response = await axios.post("YOUR_BACKEND_URL/auth/google", {
          token: result.authentication.accessToken,
        });

        if (response.status === 200) {
          await SecureStore.setItemAsync("authToken", response.data.token);
          router.replace("/(tabs)");
        }
      }
    } catch (error) {
      console.error("Google signup error:", error);
      alert("Google signup failed. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={require("../assets/images/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.title}>Create Account</Text>

      <TextInput
        style={[styles.input, { color: darkTheme.colors.text }]}
        placeholder="Email"
        placeholderTextColor="#666"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={[styles.input, { color: darkTheme.colors.text }]}
        placeholder="Password"
        placeholderTextColor="#666"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TextInput
        style={[styles.input, { color: darkTheme.colors.text }]}
        placeholder="Confirm Password"
        placeholderTextColor="#666"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />
      <TouchableOpacity style={styles.button} onPress={handleSignup}>
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.googleButton}
        onPress={handleGoogleSignup}
      >
        <Text style={styles.buttonText}>Sign up with Google</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.linkButton}
        onPress={() => router.push("/login")}
      >
        <Text style={styles.linkText}>Already have an account? Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    backgroundColor: darkTheme.colors.background,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 48,
    width: "100%",
    borderWidth: 2,
    borderColor: darkTheme.colors.border,
    borderRadius: 12,
    padding: 16,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
  logo: {
    width: "100%",
    height: 200,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 30,
    color: darkTheme.colors.text,
    textAlign: "center",
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: darkTheme.colors.border,
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 15,
    backgroundColor: darkTheme.colors.card,
  },
  button: {
    backgroundColor: darkTheme.colors.error,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  googleButton: {
    backgroundColor: darkTheme.colors.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: darkTheme.colors.text,
    fontSize: 16,
    fontWeight: "bold",
  },
  linkButton: {
    marginTop: 15,
    alignItems: "center",
  },
  linkText: {
    color: darkTheme.colors.identifier,
    fontSize: 16,
  },
});
