import React, { useState } from "react";
import {
  View,
  Text,
  ImageBackground,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../../assets/Colors";
import { useAuth } from "../../../context/authContext";
import { createPost } from "../../../utils/firestore";
import { socialAPI } from "../../../utils/api";
import { doc, getDoc } from 'firebase/firestore';
import { db } from "../../../FirebaseConfig";
import ImageDisplay from "../../../components/ImageDisplay";

export default function PostPreview() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const [publishing, setPublishing] = useState(false);
  const [postingSocial, setPostingSocial] = useState(false);

  const {
    imageUrl,
    title,
    materials,
    techniques,
    story,
    isForSale,
    price,
  } = params;

  const caption = story || `${title}\n\n${materials ? `Materials: ${materials}` : ''}\n${techniques ? `Techniques: ${techniques}` : ''}`;

  const handlePublish = async () => {
    if (!user) {
      Alert.alert("Error", "You must be logged in to publish");
      return;
    }

    if (!imageUrl) {
      Alert.alert("Error", "Image is required to publish");
      return;
    }

    try {
      setPublishing(true);

      // Fetch user data from Firestore to get actual UserName and ProfileImage
      let userName = user.displayName || user.email?.split("@")[0] || "Artist";
      let userEmail = user.email || "";
      let profileImage = null;
      
      try {
        const userDoc = await getDoc(doc(db, 'USERS', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          userName = userData.UserName || userName;
          userEmail = userData.Email || userEmail;
          profileImage = userData.ProfileImage || null;
        }
      } catch (error) {
        console.log('Error fetching user data:', error);
      }

      // Validate imageUrl is a proper URL (not a firestore:// reference)
      let finalImageUrl = imageUrl;
      if (imageUrl.startsWith('firestore://')) {
        Alert.alert("Error", "Image upload incomplete. Please try uploading again.");
        return;
      }

      // Create post in Firestore with retry logic
      const postData = {
        userId: user.uid,
        userName: userName,
        userEmail: userEmail,
        username: `@${userName.toLowerCase().replace(/\s+/g, '_')}`,
        profileImage: profileImage,
        imageUrl: finalImageUrl,
        title: title || "",
        description: caption,
        story: story || "",
        materials: materials || "",
        techniques: techniques || "",
        isForSale: isForSale === 'true' || isForSale === true,
        price: isForSale === 'true' || isForSale === true ? parseFloat(price) || 0 : null,
        createdAt: new Date().toISOString(),
        likes: 0,
        comments: 0,
        shares: 0,
        likedBy: [],
        commentsList: [],
      };

      // Retry post creation up to 3 times
      let retries = 3;
      let lastError;
      
      while (retries > 0) {
        try {
          const newPost = await createPost(postData);
          
          Alert.alert("Success", "Post published successfully!", [
            {
              text: "OK",
              onPress: () => {
                router.replace("/(tabs)/home");
              },
            },
          ]);
          return; // Success, exit function
        } catch (error) {
          lastError = error;
          retries--;
          console.error(`Post creation attempt failed. Retries left: ${retries}`, error);
          
          if (retries > 0) {
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retries)));
          }
        }
      }
      
      // All retries failed
      throw lastError || new Error('Failed to create post after multiple attempts');
      
    } catch (error) {
      console.error("Publish error:", error);
      const errorMessage = error.message || "Failed to publish post. Please check your connection and try again.";
      Alert.alert("Error", errorMessage);
    } finally {
      setPublishing(false);
    }
  };

  const handleSocialMediaPost = async (platforms = ["instagram", "twitter", "facebook"]) => {
    if (!imageUrl) {
      Alert.alert("Error", "Image is required for social media posting");
      return;
    }

    try {
      setPostingSocial(true);

      const postData = {
        imageUrl,
        caption: caption.substring(0, 2200), // Limit for social media
      };

      const results = await socialAPI.publishToMultiple(postData, platforms);

      // Show results
      const successPlatforms = Object.entries(results.data || {})
        .filter(([_, result]) => result.success)
        .map(([platform]) => platform);

      if (successPlatforms.length > 0) {
        Alert.alert(
          "Success",
          `Posted to: ${successPlatforms.join(", ")}`
        );
      } else {
        Alert.alert(
          "Info",
          "Social media posting completed. Note: API credentials may need to be configured."
        );
      }
    } catch (error) {
      console.error("Social media posting error:", error);
      Alert.alert(
        "Info",
        "Social media posting attempted. Note: API credentials may need to be configured."
      );
    } finally {
      setPostingSocial(false);
    }
  };

  const handlePublishAll = async () => {
    // First publish to ArtConnect
    await handlePublish();
    // Then post to social media
    setTimeout(() => {
      handleSocialMediaPost();
    }, 1000);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111811" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post Preview</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Profile Row */}
      <View style={styles.profileRow}>
        <ImageDisplay
          source={user?.ProfileImage || require("../../../assets/images/avtar.png")}
          style={styles.avatar}
        />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.username}>
            {user?.displayName || user?.email?.split("@")[0] || "Artist"}
          </Text>
          <Text style={styles.userEmail}>
            {user?.email || ""}
          </Text>
        </View>
      </View>

      {/* Post Card */}
      <View style={styles.postCard}>
        <Image
          source={{ uri: imageUrl || require("../../../assets/images/ppimg.png") }}
          style={styles.postImage}
          resizeMode="cover"
        />

        <View style={styles.captionContainer}>
          {title && <Text style={styles.title}>{title}</Text>}
          <Text style={styles.caption}>{caption}</Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="heart-outline" size={20} color="#111811" />
            <Text style={styles.actionText}>Like</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="chatbubble-outline" size={20} color="#111811" />
            <Text style={styles.actionText}>Comment</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="share-outline" size={20} color="#111811" />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Publish Buttons */}
      <View style={styles.publishContainer}>
        <TouchableOpacity
          style={[styles.publishButton, styles.primaryButton]}
          onPress={handlePublishAll}
          disabled={publishing || postingSocial}
        >
          {(publishing || postingSocial) ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="share-social" size={20} color="#fff" />
              <Text style={styles.publishButtonText}>Publish to ArtConnect & Social Media</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.publishButton, styles.secondaryButton]}
          onPress={handlePublish}
          disabled={publishing}
        >
          {publishing ? (
            <ActivityIndicator size="small" color="#111811" />
          ) : (
            <>
              <Ionicons name="create-outline" size={20} color="#111811" />
              <Text style={styles.publishButtonTextSecondary}>Publish to ArtConnect Only</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
    color: "#111811",
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  username: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111811",
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: "#618961",
  },
  postCard: {
    margin: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  postImage: {
    width: "100%",
    height: 300,
    backgroundColor: "#f0f0f0",
  },
  captionContainer: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111811",
    marginBottom: 8,
  },
  caption: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    color: "#111811",
    fontWeight: "500",
  },
  publishContainer: {
    padding: 16,
    gap: 12,
  },
  publishButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: Colors.bttn,
  },
  secondaryButton: {
    backgroundColor: "#f0f4f0",
  },
  publishButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  publishButtonTextSecondary: {
    color: "#111811",
    fontSize: 16,
    fontWeight: "600",
  },
});
