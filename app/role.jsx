import React from "react";
import { View, Text, ImageBackground, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native";
import { Video } from "expo-av";
import { router, useRouter } from "expo-router";
import { useAuth } from "../context/authContext";


export default function App() {
  const {UpdateUserData , setIsNewUser} = useAuth();
  const router = useRouter();
  const Rolehandler = async (Role) => {
    try {
      // Update role in Firestore
      await UpdateUserData({
        Role: Role === 0 ? "Artist" : "Buyer",
        updatedAt: new Date().toISOString()
      });
      setIsNewUser(false); // Add this line
      router.replace('/(tabs)/home');
    } catch (error) {
      console.error('Role update error:', error);
      Alert.alert('Error', 'Failed to set role. Please try again.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View>
        <View style={{ marginTop: 35 }}>
          <Video
            source={require("../assets/videos/createacc.mp4")}
            style={{
              height: 325,
              width: "auto",
              borderRadius: 12,
              overflow: "hidden"
            }}
            resizeMode="cover"
            shouldPlay     // autoplay
            isLooping      // loop forever
            isMuted
          >
          </Video>
        </View>
        <Text style={styles.heading}>Choose your role</Text>
        <Text style={styles.subHeading}>
          Tell us how you'd like to use ARTCONNECT.
        </Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={()=>Rolehandler(0)} >
            <Text style={styles.buttonText}>I'm an Artist</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={()=>Rolehandler(1)} >
            <Text style={styles.buttonText}>I'm a Buyer</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#ffffff",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    fontFamily: "Plus Jakarta Sans",
  },
  imageBackground: {
    width: "100%",
    height: 200,
    justifyContent: "flex-end",
    borderRadius: 10,
    overflow: "hidden",
  },
  heading: {
    color: "#111717",
    fontSize: 28,
    marginTop: 10,
    fontWeight: "700",
    textAlign: "center",
    paddingTop: 20,
    paddingBottom: 10,
  },
  subHeading: {
    color: "#111717",
    fontSize: 16,
    fontWeight: "400",
    textAlign: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  buttonContainer: {
    marginTop: 20,
    width: "90%",
    maxWidth: 480,
    alignSelf: "center",
    gap: 10,
  },
  button: {
    backgroundColor: "#BFB24F", // updated color
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 125,
    marginVertical: 5,
  },
  buttonText: {
    color: "#111717",
    fontSize: 16,
    fontWeight: "700",
  },
});
