import { View, Text } from 'react-native';
import React from 'react';
import { HeaderShownContext } from "@react-navigation/elements";
import { Stack } from "expo-router";
import { Tabs } from 'expo-router';
import { SafeAreaProvider } from "react-native-safe-area-context";
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// const Tab = createBottomTabNavigator();

export default function TabLayout() {
  return (
    <SafeAreaProvider>

      {/* header shown false will remove the header bar */}
      
      <Tabs screenOptions={{headerShown:false}} >
        <Tabs.Screen name='home' options={{title:"home"}}/>
        <Tabs.Screen name='post' options={{title:"post_upload"}}/>
        <Tabs.Screen name='videos' options={{title:"reels"}}/>
        <Tabs.Screen name='profile' options={{title:"user"}}/>
        
        </Tabs>
    </SafeAreaProvider>

    

  );
  
}