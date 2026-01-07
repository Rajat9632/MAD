import { HeaderShownContext } from "@react-navigation/elements";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
  <SafeAreaProvider><Stack screenOptions={{headerShown:false}}>
    <Stack.Screen
    name="index"/>
    <Stack.Screen
    name="postpreview"/>
    <Stack.Screen
    name="posted"/>
    </Stack>
  </SafeAreaProvider>
  );

}