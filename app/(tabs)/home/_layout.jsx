import { View, Text } from 'react-native';
import React from 'react';
import { HeaderShownContext } from "@react-navigation/elements";
import { Stack } from "expo-router";
import { Tabs } from 'expo-router';
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function HomeLayout() {
  return (
    <SafeAreaProvider>
        <Stack screenOptions={{headerShown:false}}>
                <Stack.Screen name = "index"/>
              </Stack>
    </SafeAreaProvider>

    

  );
  
}