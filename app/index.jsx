import { useRouter, router } from "expo-router";
import { View, Text, ImageBackground, StyleSheet, Animated,Easing} from "react-native";
import { Colors } from "../assets/Colors";
import { SafeAreaView } from "react-native-safe-area-context";
import { timeout } from "../constants/timeout";
import { useRef ,useEffect} from "react";

export default function SplashScreen() {

  const progress = useRef(new Animated.Value(0)).current;

  //Animate splash progress bar
  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: timeout.timeout,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  }, []);


  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Section with Image */}
      <View style={styles.imageWrapper}>
        <ImageBackground
          source={require("../assets/images/splashscreen.png")}
          style={styles.image}
          resizeMode="cover"
        />
      </View>

      {/* Title & Subtitle */}
      <Text style={styles.title}>ARTCONNECT</Text>
      <Text style={styles.subtitle}>Authentic crafts. Global reach.</Text>

      {/* Bottom Progress Bar */}
      <View style={styles.bottomWrapper}>
        <View style={styles.progressBackground}>
          <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "space-between",
  },
  imageWrapper: {
    width: "100%",
    aspectRatio: 1 / 1.7,
  },
  image: {
    flex: 1,
  },
  title: {
    fontSize: 38,
    fontWeight: "bold",
    color: "#111717",
    textAlign: "center",
    paddingTop: 20,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "400",
    color: "#111717",
    textAlign: "center",
    paddingBottom: 12,
  },
  bottomWrapper: {
    padding: 18,
  },
  progressBackground: {
    backgroundColor: "#dce5e5",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBar: {
    height: 10,
    backgroundColor: Colors.bttn,
    borderRadius: 4,
    width: "100%",
  },
});
