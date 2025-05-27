import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import axiosInstance from "@/config/axios";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

interface Syllabus {
  id: number;
  title: string;
}

export default function SyllabusScreen() {
  const router = useRouter();
  const [syllabuses, setSyllabuses] = useState<Syllabus[]>([]);

  const fetchSyllabuses = async () => {
    try {
      //use axiosInstance
      const response = await axiosInstance.get("/syllabus");
      setSyllabuses(response.data);
    } catch (error) {
      console.error("Error fetching syllabuses:", error);
    }
  };

  const handleDelete = async (id: number) => {
    Alert.alert(
      "Delete Syllabus",
      "Are you sure you want to delete this syllabus?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await axiosInstance.delete(`/syllabus/${id}`);
              fetchSyllabuses();
            } catch (error) {
              console.error("Error deleting syllabus:", error);
            }
          },
        },
      ]
    );
  };

  const handleRename = async (id: number, currentTitle: string) => {
    Alert.prompt(
      "Rename Syllabus",
      "Enter new name for the syllabus",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Rename",
          onPress: async (newTitle?: string) => {
            if (newTitle?.trim()) {
              try {
                await axiosInstance.patch(`/syllabus/${id}`, {
                  title: newTitle.trim(),
                });
                fetchSyllabuses();
              } catch (error) {
                console.error("Error renaming syllabus:", error);
              }
            }
          },
        },
      ],
      "plain-text",
      currentTitle
    );
  };

  const handleUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
      });

      if (result.assets && result.assets[0]) {
        const file = result.assets[0];
        const formData = new FormData();

        formData.append("file", {
          uri: file.uri,
          name: file.name,
          type: "application/pdf",
        } as any);

        const response = await axiosInstance.post(
          "/syllabus/upload",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Accept: "application/json",
            },
          }
        );

        if (response.status === 201) fetchSyllabuses();
      }
    } catch (error) {
      console.log(JSON.stringify(error));
      console.error("Error uploading file:", error);
    }
  };

  const handleView = (id: number) => {
    router.push(`/syllabus/${id}`);
  };

  useEffect(() => {
    fetchSyllabuses();
  }, []);

  return (
    <View style={styles.container}>
      <FlatList
        data={syllabuses}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.syllabusItem}>
            <TouchableOpacity
              style={styles.titleContainer}
              onPress={() => handleView(item.id)}
            >
              <Text style={styles.syllabusTitle}>{item.title}</Text>
            </TouchableOpacity>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                onPress={() => handleRename(item.id, item.title)}
                style={styles.actionButton}
              >
                <Ionicons name="pencil" size={20} color="#007AFF" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDelete(item.id)}
                style={styles.actionButton}
              >
                <Ionicons name="trash-outline" size={20} color="red" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <TouchableOpacity style={styles.uploadButton} onPress={handleUpload}>
        <Text style={styles.buttonText}>Upload Syllabus</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  uploadButton: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
  },
  syllabusItem: {
    padding: 16,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  syllabusTitle: {
    fontSize: 16,
  },
  titleContainer: {
    flex: 1,
    paddingRight: 8,
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
});
