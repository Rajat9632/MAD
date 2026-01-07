import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import { Video } from "expo-av";
import { Colors } from "../assets/Colors";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator, 
  StyleSheet 
} from "react-native";
import CustomKeyboardView from "../components/CustomKeyboardView";
import { useAuth } from "../context/authContext";

export default function SignUpScreen() {
  const router = useRouter();

  const emailRef = useRef();
  const passwordRef = useRef();
  const usernameRef = useRef();
  const { register} = useAuth();
  const [loading, setLoading]=useState(false);
  

  const handleRegister = async () => {
    if (!emailRef.current || !passwordRef.current || !usernameRef.current) {
      Alert.alert("Empty Fields", "Fill all the fields");
      return;
    }
    try {
      setLoading(true);
        const response = await register(
            emailRef.current,
            passwordRef.current,
            usernameRef.current
        );
        if (!response.success) {
            Alert.alert("Sign Up Error", response.msg);
        }
    } catch (error) {
       Alert.alert("Error", "Registration failed. Please try again.");
       
    }
    finally {
        setLoading(false);
    }
  };

  return (
    <CustomKeyboardView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Video Banner */}
      <View style={styles.videoWrapper}>
        <Video
          source={require("../assets/videos/createacc.mp4")}
          style={styles.video}
          resizeMode="contain"
          shouldPlay
          isLooping
          isMuted
        />
      </View>

      {/* Title */}
      <View>
        <Text style={styles.title}>Create an account</Text>
      </View>

      {/* Username Input */}
      <View style={styles.inputWrapper}>
        <TextInput
          placeholder="Username"
          onChangeText={(value) => (usernameRef.current = value)}
          style={styles.input}
          placeholderTextColor="#648787"
        />
      </View>

      {/* Email Input */}
      <View style={styles.inputWrapper}>
        <TextInput
          placeholder="Email"
          autoCapitalize="none"
          textContentType="emailAddress"
          autoComplete="email"
          onChangeText={(value) => (emailRef.current = value)}
          style={styles.input}
          placeholderTextColor="#648787"
        />
      </View>

      {/* Password Input */}
      <View style={styles.inputWrapper}>
        <TextInput
          placeholder="Password"
          secureTextEntry
          onChangeText={(value) => (passwordRef.current = value)}
          style={styles.input}
          placeholderTextColor="#648787"
        />
      </View>

      {/* Sign Up Button */}
      <View style={styles.buttonWrapper}>
        <TouchableOpacity
          style={[styles.button, styles.signupButton]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="large" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign Up</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <Text style={styles.footerText}>Already have an account?</Text>
      <TouchableOpacity onPress={() => router.replace("/login")}>
        <Text style={styles.footerLink}>Log in</Text>
      </TouchableOpacity>
    </CustomKeyboardView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  contentContainer: {
    flexGrow: 1,
    marginTop: 12,
  },
  videoWrapper: {
    marginTop: 5,
  },
  video: {
    height: 325,
    width: "auto",
    borderRadius: 12,
    overflow: "hidden",
  },
  title: {
    color: Colors.primaryText ?? "#111717",
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 20,
    marginBottom: 20,
    fontFamily: "PlusJakartaSans-Bold",
  },
  inputWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  input: {
    backgroundColor: "#f0f4f4",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#111717",
  },
  buttonWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    borderRadius: 8,
  },
  signupButton: {
    backgroundColor: Colors.bttn,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#111717",
  },
  footerText: {
    color: "#648787",
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
  },
  footerLink: {
    color: "#648787",
    fontSize: 14,
    textAlign: "center",
    textDecorationLine: "underline",
    marginBottom: 16,
  },
});
