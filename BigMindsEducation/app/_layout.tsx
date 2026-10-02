import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { AuthProvider } from './context/AuthContext';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  useEffect(() => {
    // Fonts load ho gayi ya error aa gaya — dono cases mein splash hide karo
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Jab tak fonts load nahi hoti, kuch render mat karo
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <AuthProvider>
      <PaperProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="auth" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="teacher-dashboard" options={{ headerShown: false }} />
            <Stack.Screen name="teacher" />
            <Stack.Screen name="admin-panel" />
            <Stack.Screen name="forum-detail/[forumId]" options={{ headerShown: false }} />
            <Stack.Screen name="topic-detail/[topicId]" options={{ headerShown: false }} />
            <Stack.Screen name="course-detail/[courseId]" options={{ headerShown: false }} />
            <Stack.Screen name="course-learning/[courseId]" options={{ headerShown: false }} />
            {/* Dynamic routes are auto-discovered by Expo Router */}
          </Stack>
        </GestureHandlerRootView>
      </PaperProvider>
    </AuthProvider>
  );
} 