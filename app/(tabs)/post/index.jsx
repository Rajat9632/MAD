import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../../assets/Colors";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../../context/authContext";
import { uploadImage } from "../../../utils/mediaStorage";
import { aiAPI } from "../../../utils/api";
import * as Location from "expo-location";
import * as FileSystem from "expo-file-system/legacy";

export default function StoryScreen() {
  const [title, setTitle] = useState("");
  const [materials, setMaterials] = useState("");
  const [techniques, setTechniques] = useState("");
  const [story, setStory] = useState("");
  const [imageUri, setImageUri] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  const pickImage = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "We need camera roll permissions to upload images");
        return;
      }

      // Pick image
      // Use new MediaType API (expo-image-picker v17+)
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType?.Images ?? ImagePicker.MediaTypeOptions?.Images ?? 'images',
        allowsEditing: true,
        aspect: [3, 2],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Image picker error:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const generateCaption = async () => {
    if (!imageUri) {
      Alert.alert("Error", "Please select an image first");
      return;
    }

    try {
      setGenerating(true);
      
      // Convert local image to base64 for Vision API
      let imageBase64 = null;
      if (imageUri && !imageUri.startsWith('http') && !imageUri.startsWith('https')) {
        try {
          // Try with enum first, fallback to string
          let encodingOption;
          if (FileSystem.EncodingType && FileSystem.EncodingType.Base64) {
            encodingOption = FileSystem.EncodingType.Base64;
          } else {
            encodingOption = 'base64';
          }
          
          const base64String = await FileSystem.readAsStringAsync(imageUri, {
            encoding: encodingOption,
          });
          // Add data URL prefix
          imageBase64 = `data:image/jpeg;base64,${base64String}`;
        } catch (e) {
          console.error('Failed to convert image to base64:', e);
          // Fallback: try with imageUri (might work if it's a URL)
        }
      }
      
      // Send to API with base64 or URI
      const response = await aiAPI.generateCaption(imageUri, '', imageBase64);
      if (response.success && response.data.caption) {
        // Auto-fill story with caption if empty
        if (!story) {
          setStory(response.data.caption);
        }
        Alert.alert("Success", "Caption generated successfully!");
      }
    } catch (error) {
      console.error("Caption generation error:", error);
      const errorMsg = error.message || 'Failed to generate caption';
      if (errorMsg.includes('Network') || errorMsg.includes('ECONNREFUSED')) {
        Alert.alert("Server Error", "Cannot connect to server. Please make sure your server is running on port 5000.");
      } else {
        Alert.alert("Error", errorMsg);
      }
    } finally {
      setGenerating(false);
    }
  };

  const generateStory = async () => {
    if (!title) {
      Alert.alert("Error", "Please enter a title first");
      return;
    }

    try {
      setGenerating(true);
      
      // Get user location for regional content
      let region = "";
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const location = await Location.getCurrentPositionAsync();
          // In real app, reverse geocode to get region
          region = "Maharashtra"; // Placeholder
        }
      } catch (error) {
        console.log("Location permission denied");
      }

      const response = await aiAPI.generateStory({
        title,
        materials,
        techniques,
        personalStory: story,
        language: "en",
        region,
      });

      if (response.success && response.data.story) {
        setStory(response.data.story);
        Alert.alert("Success", "Story generated successfully!");
      }
    } catch (error) {
      console.error("Story generation error:", error);
      Alert.alert("Error", "Failed to generate story. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handlePreview = async () => {
    if (!imageUri || !title) {
      Alert.alert("Error", "Please add an image and title");
      return;
    }

    try {
      setUploading(true);
      
      // Upload image to Firebase Storage with progress tracking
      let uploadProgress = 0;
      const imageUrl = await uploadImage(
        imageUri, 
        user.uid, 
        "posts",
        (progress) => {
          uploadProgress = progress;
          // You can show progress to user if needed
          console.log(`Upload progress: ${progress.toFixed(0)}%`);
        }
      );
      
      // Validate that we got a proper URL
      if (!imageUrl || imageUrl.startsWith('firestore://')) {
        throw new Error('Image upload failed. Please try again.');
      }
      
      // Navigate to preview with data
      router.push({
        pathname: "/post/postpreview",
        params: {
          imageUrl,
          title,
          materials,
          techniques,
          story,
        },
      });
    } catch (error) {
      console.error("Upload error:", error);
      const errorMessage = error.message || "Failed to upload image. Please check your connection and try again.";
      Alert.alert("Error", errorMessage);
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaProvider>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconBox}>
            {/* Back arrow */}
            <Text style={styles.icon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerText}>AI Storytelling</Text>
        </View>

        {/* Image Section */}
        <View style={styles.imageWrapper}>
          {imageUri ? (
            <ImageBackground source={{ uri: imageUri }} style={styles.image}>
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => setImageUri(null)}
              >
                <Ionicons name="close-circle" size={28} color="#fff" />
              </TouchableOpacity>
            </ImageBackground>
          ) : (
            <TouchableOpacity
              style={styles.imagePlaceholder}
              onPress={pickImage}
            >
              <Ionicons name="camera" size={48} color="#897561" />
              <Text style={styles.imagePlaceholderText}>Tap to add image</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* AI Generate Caption Button */}
        {imageUri && (
          <View style={styles.buttonWrapper}>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={generateCaption}
              disabled={generating}
            >
              {generating ? (
                <ActivityIndicator size="small" color="#181411" />
              ) : (
                <>
                  <Ionicons name="sparkles" size={18} color="#181411" />
                  <Text style={styles.buttonText}>Generate Caption with AI</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Title */}
        <Text style={styles.title}>
          Craft a compelling narrative for your creation using AI.
        </Text>

        {/* Form Inputs */}
        <View style={styles.inputWrapper}>
          <Text style={styles.label}>Craft Title</Text>
          <TextInput
            style={styles.input}
            placeholder="Rajasthani wooden bowl"
            placeholderTextColor="#897561"
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View style={styles.inputWrapper}>
          <Text style={styles.label}>Materials Used</Text>
          <TextInput
            style={styles.input}
            placeholder="sheesham wood"
            placeholderTextColor="#897561"
            value={materials}
            onChangeText={setMaterials}
          />
        </View>

        <View style={styles.inputWrapper}>
          <Text style={styles.label}>Techniques Applied</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Hand-carved with traditional motifs"
            placeholderTextColor="#897561"
            value={techniques}
            onChangeText={setTechniques}
          />
        </View>

        <View style={styles.inputWrapper}>
          <Text style={styles.label}>Personal Story or Inspiration</Text>
          <TextInput
            style={[styles.input, { minHeight: 100, textAlignVertical: "top" }]}
            multiline
            placeholder="e.g., Passed down through generations in my family"
            placeholderTextColor="#897561"
            value={story}
            onChangeText={setStory}
          />
        </View>

        {/* Generate Story with AI Button */}
        {title && (
          <View style={styles.buttonWrapper}>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={generateStory}
              disabled={generating}
            >
              {generating ? (
                <ActivityIndicator size="small" color="#181411" />
              ) : (
                <>
                  <Ionicons name="create" size={18} color="#181411" />
                  <Text style={styles.buttonText}>Generate Story with AI</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Preview Button */}
        <View style={styles.buttonWrapper}>
          <TouchableOpacity
            style={styles.button}
            onPress={handlePreview}
            disabled={uploading || !imageUri || !title}
          >
            {uploading ? (
              <ActivityIndicator size="small" color="#181411" />
            ) : (
              <Text style={styles.buttonText}>Preview & Publish</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Bottom Navigation */}
      </ScrollView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    marginTop:15,  //later will remove this ..this won't be responsive in other devices
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingBottom: 8,
    justifyContent: "space-between",
  },
  iconBox: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    fontSize: 22,
    color: "#181411",
  },
  headerText: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: "#181411",
    paddingRight: 48, // for spacing
  },
  imageWrapper: {
    width: "100%",
    aspectRatio: 1.5,
    padding: 16,
  },
  image: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#181411",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  inputWrapper: {
    maxWidth: 480,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: "#181411",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e6e0db",
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: "#181411",
    backgroundColor: "#fff",
  },
  buttonWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  button: {
    backgroundColor: Colors.bttn,
    borderRadius: 12,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "#181411",
    fontSize: 14,
    fontWeight: "700",
  },
  navBar: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#f4f2f0",
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: "space-around",
  },
  navItem: {
    flex: 1,
    alignItems: "center",
  },
  navIcon: {
    fontSize: 22,
    color: "#897561",
  },
  imagePlaceholder: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e6e0db",
    borderStyle: "dashed",
  },
  imagePlaceholderText: {
    marginTop: 12,
    fontSize: 14,
    color: "#897561",
  },
  removeImageButton: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 14,
  },
  secondaryButton: {
    backgroundColor: "#f0f4f0",
    flexDirection: "row",
    gap: 8,
  },
});
