import { HeaderShownContext } from "@react-navigation/elements";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
  <SafeAreaProvider><Stack screenOptions={{headerShown:false}}>
    <Stack.Screen name="index"/>
    <Stack.Screen name="edit-profile"/>
    <Stack.Screen name="settings"/>
    <Stack.Screen name="help"/>
    <Stack.Screen name="about"/>
    </Stack>
  </SafeAreaProvider>
  );

}