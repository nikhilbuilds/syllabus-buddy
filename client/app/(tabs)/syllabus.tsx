import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { darkTheme } from "@/constants/theme";
import UploadModal from "@/components/UploadModal";
import axiosInstance from "@/config/axios";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAuth } from "@/context/auth";
import { LANGUAGES } from "@/constants/language";
import { useTranslation } from "react-i18next";

interface Syllabus {
  id: number;
  title: string;
  preferredLanguage: string;
}

export default function SyllabusScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useTranslation();

  const [syllabuses, setSyllabuses] = useState<Syllabus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);

  const fetchSyllabuses = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get("/syllabus");
      setSyllabuses(response.data);
    } catch (error) {
      console.error("Error fetching syllabuses:", error);
      Alert.alert("Error", "Failed to fetch syllabuses");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSyllabuses();
    setRefreshing(false);
  }, [fetchSyllabuses]);

  // Fetch syllabuses when component mounts
  useEffect(() => {
    fetchSyllabuses();
  }, [fetchSyllabuses]);

  // Refresh syllabuses when tab comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchSyllabuses();
    }, [fetchSyllabuses])
  );

  const handleSyllabusPress = (syllabusId: number, syllabusTitle: string) => {
    router.push({
      pathname: "/syllabus/[id]",
      params: { id: Number(syllabusId) },
    });
  };

  const handleRename = async (syllabusId: number, currentTitle: string) => {
    Alert.prompt(
      "Rename Syllabus",
      "Enter new name for the syllabus",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Rename",
          onPress: async (newTitle?: string) => {
            if (newTitle?.trim() && newTitle.trim() !== currentTitle) {
              try {
                await axiosInstance.patch(`/syllabus/${syllabusId}`, {
                  title: newTitle.trim(),
                });
                // Refresh the list after renaming
                await fetchSyllabuses();
                Alert.alert("Success", "Syllabus renamed successfully");
              } catch (error) {
                console.error("Error renaming syllabus:", error);
                Alert.alert("Error", "Failed to rename syllabus");
              }
            }
          },
        },
      ],
      "plain-text",
      currentTitle
    );
  };

  const handleUploadSuccess = (syllabusId: number) => {
    // Refresh the list and optionally navigate to the new syllabus
    fetchSyllabuses();
    router.push(`/syllabus/${syllabusId}`);
  };

  const renderSyllabusItem = ({ item }: { item: Syllabus }) => (
    <View style={styles.syllabusItem}>
      <TouchableOpacity
        style={styles.syllabusContent}
        onPress={() => handleSyllabusPress(item.id, item.title)}
      >
        <View style={styles.syllabusIcon}>
          <Ionicons
            name="document-text"
            size={24}
            color={darkTheme.colors.identifier}
          />
        </View>
        <View style={styles.syllabusInfo}>
          <Text style={styles.syllabusTitle}>
            {item.title}{" "}
            {
              LANGUAGES.find((lang) => lang.code === item.preferredLanguage)
                ?.icon
            }
          </Text>

          <Text style={styles.syllabusSubtitle}>Tap to view details</Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={darkTheme.colors.textSecondary}
        />
      </TouchableOpacity>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleRename(item.id, item.title)}
        >
          <Ionicons
            name="pencil"
            size={18}
            color={darkTheme.colors.identifier}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <Ionicons
          name="document-text-outline"
          size={64}
          color={darkTheme.colors.textSecondary}
        />
      </View>
      <Text style={styles.emptyTitle}>No Syllabuses Yet</Text>
      <Text style={styles.emptySubtitle}>
        Create your first syllabus to get started with your learning journey
      </Text>
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => setUploadModalVisible(true)}
      >
        <Ionicons name="add" size={20} color="white" />
        <Text style={styles.createButtonText}>Create Syllabus</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t("syllabus.my_syllabuses")}</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
          disabled={refreshing}
        >
          <Ionicons
            name="refresh"
            size={24}
            color={
              refreshing
                ? darkTheme.colors.textSecondary
                : darkTheme.colors.identifier
            }
          />
        </TouchableOpacity>
      </View>

      <FlatList
        data={syllabuses}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderSyllabusItem}
        contentContainerStyle={[
          styles.listContainer,
          syllabuses.length === 0 && styles.emptyListContainer,
        ]}
        ListEmptyComponent={!isLoading ? renderEmptyState : null}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#007AFF"
            colors={["#007AFF"]}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Add Button - only show when there are syllabuses */}
      {syllabuses.length > 0 && (
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={() => setUploadModalVisible(true)}
        >
          <Ionicons name="add" size={28} color="white" />
        </TouchableOpacity>
      )}

      {/* Upload Modal */}
      <UploadModal
        visible={uploadModalVisible}
        onClose={() => setUploadModalVisible(false)}
        onSuccess={handleUploadSuccess}
        user={user}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkTheme.colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.colors.border,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: darkTheme.colors.text,
  },
  refreshButton: {
    padding: 8,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100, // Space for floating button
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyIcon: {
    marginBottom: 24,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: darkTheme.colors.text,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 16,
    color: darkTheme.colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007AFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  createButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  syllabusItem: {
    flexDirection: "row",
    backgroundColor: darkTheme.colors.card,
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  syllabusContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  syllabusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#007AFF15",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  syllabusInfo: {
    flex: 1,
  },
  syllabusTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: darkTheme.colors.text,
    marginBottom: 4,
  },
  syllabusSubtitle: {
    fontSize: 14,
    color: darkTheme.colors.textSecondary,
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  floatingButton: {
    position: "absolute",
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: darkTheme.colors.identifier,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
