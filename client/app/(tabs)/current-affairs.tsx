import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  RefreshControl,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import axiosInstance from "../../config/axios";
import { Ionicons } from "@expo/vector-icons";
import { darkTheme } from "../../constants/theme";

interface CurrentAffair {
  id: string;
  headline: string;
  publishedDate: string;
  isImportant: boolean;
}

interface CurrentAffairsResponse {
  affairs: CurrentAffair[];
  total: number;
  page: number;
  totalPages: number;
}

const ITEMS_PER_PAGE = 10;

export default function CurrentAffairsScreen() {
  const [affairs, setAffairs] = useState<CurrentAffair[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(true);
  const router = useRouter();
  const spinValue = new Animated.Value(0);

  useEffect(() => {
    if (refreshing) {
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      spinValue.setValue(0);
    }
  }, [refreshing]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  useEffect(() => {
    fetchCurrentAffairs();
  }, []);

  const fetchCurrentAffairs = async (page = 1) => {
    try {
      const response = await axiosInstance.get<CurrentAffairsResponse>(
        `/current-affairs?page=${page}&limit=${ITEMS_PER_PAGE}`
      );

      if (page === 1) {
        setAffairs(response.data.affairs);
      } else {
        setAffairs((prev) => [...prev, ...response.data.affairs]);
      }

      setCurrentPage(response.data.page);
      setHasMorePages(response.data.page < response.data.totalPages);
    } catch (error) {
      console.error("Error fetching current affairs:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setCurrentPage(1);
    setHasMorePages(true);
    fetchCurrentAffairs(1);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMorePages) {
      setLoadingMore(true);
      fetchCurrentAffairs(currentPage + 1);
    }
  };

  const handleAffairPress = (affair: CurrentAffair) => {
    router.push({
      pathname: "/current-affairs/[id]",
      params: { id: affair.id },
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const renderFooter = () => {
    if (!hasMorePages) return null;

    return (
      <TouchableOpacity
        style={[
          styles.loadMoreButton,
          loadingMore && styles.loadMoreButtonDisabled,
        ]}
        onPress={handleLoadMore}
        disabled={loadingMore}
      >
        {loadingMore ? (
          <ActivityIndicator size="small" color={darkTheme.colors.text} />
        ) : (
          <Text style={styles.loadMoreText}>Load More</Text>
        )}
      </TouchableOpacity>
    );
  };

  const refreshControl = (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={handleRefresh}
      colors={[darkTheme.colors.identifier]}
      tintColor={darkTheme.colors.identifier}
      title="Refreshing..."
      titleColor={darkTheme.colors.text}
    />
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={darkTheme.colors.identifier} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Current Affairs",
          headerStyle: {
            backgroundColor: darkTheme.colors.background,
          },
          headerTintColor: darkTheme.colors.text,
          headerRight: () => (
            <TouchableOpacity
              onPress={handleRefresh}
              disabled={refreshing}
              style={styles.refreshButton}
            >
              <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <Ionicons
                  name="refresh"
                  size={24}
                  color={darkTheme.colors.text}
                  style={[
                    styles.refreshIcon,
                    refreshing && styles.refreshingIcon,
                  ]}
                />
              </Animated.View>
            </TouchableOpacity>
          ),
        }}
      />
      <FlatList
        data={affairs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.affairItem,
              item.isImportant && styles.importantAffairItem,
            ]}
            onPress={() => handleAffairPress(item)}
          >
            <View style={styles.affairHeader}>
              <Text style={styles.headline}>{item.headline}</Text>
              {item.isImportant && (
                <Ionicons
                  name="star"
                  size={20}
                  color={darkTheme.colors.identifier}
                  style={styles.importantIcon}
                />
              )}
            </View>
            <Text style={styles.date}>{formatDate(item.publishedDate)}</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContainer}
        ListFooterComponent={renderFooter}
        refreshControl={refreshControl}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkTheme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: darkTheme.colors.background,
  },
  listContainer: {
    padding: 16,
  },
  affairItem: {
    backgroundColor: darkTheme.colors.card,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: darkTheme.colors.border,
  },
  importantAffairItem: {
    borderLeftWidth: 4,
    borderLeftColor: darkTheme.colors.identifier,
  },
  affairHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  headline: {
    color: darkTheme.colors.text,
    fontSize: 16,
    fontWeight: "500",
    flex: 1,
    marginRight: 8,
  },
  importantIcon: {
    marginTop: 2,
  },
  date: {
    color: darkTheme.colors.textSecondary,
    fontSize: 14,
  },
  loadMoreButton: {
    backgroundColor: darkTheme.colors.card,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
    borderWidth: 1,
    borderColor: darkTheme.colors.border,
  },
  loadMoreButtonDisabled: {
    opacity: 0.7,
  },
  loadMoreText: {
    color: darkTheme.colors.text,
    fontSize: 16,
    fontWeight: "500",
  },
  refreshButton: {
    padding: 8,
    marginRight: 8,
  },
  refreshIcon: {
    opacity: 1,
  },
  refreshingIcon: {
    opacity: 0.7,
  },
});
