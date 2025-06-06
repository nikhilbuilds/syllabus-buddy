import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { darkTheme } from "@/constants/theme";
import { NotificationService } from "@/services/notificationService";

export default function AboutScreen() {
  // const handleRegenerateToken = async () => {
  //   try {
  //     const newToken = await NotificationService.regeneratePushToken();
  //     if (newToken) {
  //       Alert.alert(
  //         "Success",
  //         `New token generated: ${newToken.substring(0, 50)}...`
  //       );
  //     } else {
  //       Alert.alert("Error", "Failed to generate new token");
  //     }
  //   } catch (error) {
  //     Alert.alert("Error", "Failed to regenerate token");
  //   }
  // };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.title}>About Syllabus Buddy</Text>
        <Text style={styles.description}>
          Your AI-powered study companion that transforms how you learn from
          your syllabus.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Features</Text>
        <View style={styles.featureItem}>
          <Text style={styles.featureTitle}>Smart Topic Parsing</Text>
          <Text style={styles.featureText}>
            Automatically extracts and organizes topics from your syllabus using
            AI
          </Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureTitle}>Personalized Quizzes</Text>
          <Text style={styles.featureText}>
            Generates custom quizzes based on your syllabus content
          </Text>
        </View>
        <View style={styles.featureItem}>
          <Text style={styles.featureTitle}>Progress Tracking</Text>
          <Text style={styles.featureText}>
            Monitor your learning progress with detailed statistics
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How It Works</Text>
        <Text style={styles.text}>
          Simply upload your syllabus, and our AI will analyze it to create a
          structured learning plan. Practice with auto-generated quizzes and
          track your progress over time.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Version</Text>
        <Text style={styles.text}>1.0.0</Text>
      </View>

      {/* <View style={styles.section}>
        <Text style={styles.sectionTitle}>Push Notifications</Text>
        <TouchableOpacity style={styles.button} onPress={handleRegenerateToken}>
          <Text style={styles.buttonText}>Regenerate Push Token</Text>
        </TouchableOpacity>
      </View> */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkTheme.colors.background,
    padding: 16,
  },
  section: {
    backgroundColor: darkTheme.colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: darkTheme.colors.text,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: darkTheme.colors.textSecondary,
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: darkTheme.colors.text,
    marginBottom: 16,
  },
  featureItem: {
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: darkTheme.colors.primary,
    marginBottom: 4,
  },
  featureText: {
    fontSize: 14,
    color: darkTheme.colors.textSecondary,
    lineHeight: 20,
  },
  text: {
    fontSize: 14,
    color: darkTheme.colors.textSecondary,
    lineHeight: 20,
  },
  button: {
    backgroundColor: "#ffd33d",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "black",
    fontWeight: "bold",
  },
});
