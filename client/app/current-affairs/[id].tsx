import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import axiosInstance from "../../config/axios";
import { darkTheme } from "../../constants/theme";

interface CurrentAffair {
  id: string;
  headline: string;
  summary: string;
  keywords: string[];
  relatedTopics: string[];
}

export default function CurrentAffairDetailScreen() {
  const { id } = useLocalSearchParams();
  const [affair, setAffair] = useState<CurrentAffair | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCurrentAffair();
  }, [id]);

  const fetchCurrentAffair = async () => {
    try {
      const response = await axiosInstance.get<CurrentAffair>(
        `/current-affairs/${id}`
      );
      setAffair(response.data);
    } catch (error) {
      console.error("Error fetching current affair:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={darkTheme.colors.identifier} />
      </SafeAreaView>
    );
  }

  if (!affair) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Article not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.headline}>{affair.headline}</Text>
          <Text style={styles.summary}>{affair.summary}</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Keywords</Text>
            <View style={styles.tagsContainer}>
              {affair.keywords.map((keyword, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{keyword}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Related Topics</Text>
            <View style={styles.tagsContainer}>
              {affair.relatedTopics.map((topic, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{topic}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkTheme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: darkTheme.colors.background,
  },
  content: {
    padding: 16,
  },
  headline: {
    color: darkTheme.colors.text,
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  summary: {
    color: darkTheme.colors.text,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: darkTheme.colors.identifier,
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    backgroundColor: darkTheme.colors.card,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: darkTheme.colors.border,
  },
  tagText: {
    color: darkTheme.colors.text,
    fontSize: 14,
  },
  errorText: {
    color: darkTheme.colors.text,
    fontSize: 16,
    textAlign: "center",
    marginTop: 24,
  },
});
