// app/post-published.js
import React from "react";
import {
  View,
  Text,
  ImageBackground,
  TouchableOpacity,
  StyleSheet
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Colors } from "../../../assets/Colors";

export default function PostPublished() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {/* Back Arrow */}
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post Published</Text>
      </View>

      {/* Post Image */}
      <View style={styles.imageWrapper}>
        <ImageBackground
          source={{
            uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuBL_mVZCBmLerjRyAo6wMwrI2YLNZro2Uo-e4jYr-CckepcW_bIa9lK6HpRslHojYO78R3dWyrg2AHWdArEMNmUn8c9QRCjlGkspczoqRROxlmyrheHgXIcYX9ZFFrWNdHGGxF27qLoPaOgt8eEW6MAU3JkcIfdfJC5uRSIYsnwQ3RHsm0zQy2jhFhQT5ioqTI4sQPCQSdjB8zvcfhMm8jh7V7MYAELTVGu67awzzOIWNSV7SZ-UFAVoZvNoMEcFCSMbflq_az_cVQ",
          }}
          style={styles.image}
          resizeMode="cover"
        />
      </View>

      {/* Title + Message */}
      <Text style={styles.title}>Your craft is live!</Text>
      <Text style={styles.subtitle}>
        Your post has been successfully published and is now visible to your
        audience.
      </Text>

      {/* Buttons */}
      <View style={styles.buttonWrapper}>
        <TouchableOpacity style={styles.viewButton}>
          <Text style={styles.viewButtonText}>View Post</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => router.push("/home")}
        >
          <Text style={styles.homeButtonText}>Go to Home</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", justifyContent: "space-between" },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    justifyContent: "center",
  },
  backArrow: {
    fontSize: 22,
    position: "absolute",
    left: 16,
    color: "#111811",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111811",
  },

  // Image
  imageWrapper: {
    width: "100%",
    aspectRatio: 3 / 2,
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 8,
    paddingHorizontal: 16,
  },
  image: { flex: 1, borderRadius: 12 },

  // Texts
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#111811",
    textAlign: "center",
    marginTop: 20,
  },
  subtitle: {
    fontSize: 16,
    color: "#111811",
    textAlign: "center",
    marginTop: 8,
    marginHorizontal: 16,
  },

  // Buttons
  buttonWrapper: { padding: 16, gap: 12 },
  viewButton: {
    backgroundColor: "#13ec13",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  viewButtonText: { color: "#111811", fontWeight: "bold", fontSize: 16 },
  homeButton: {
    backgroundColor: "#f0f4f0",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  homeButtonText: { color: "#111811", fontWeight: "bold", fontSize: 16 },

  // Bottom Nav
  bottomNav: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderColor: "#f0f4f0",
    paddingVertical: 10,
    justifyContent: "space-around",
  },
  navItem: { alignItems: "center", flex: 1 },
  navIcon: { fontSize: 24, color: "#618961" },
});
