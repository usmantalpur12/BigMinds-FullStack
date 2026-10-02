import React, { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { TeacherThemeProvider } from '../theme/teacherTheme';
import { useAuth } from '../context/AuthContext';

export default function TeacherLayout() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && user && user.role !== 'teacher' && user.role !== 'admin') {
      router.replace('/(tabs)');
    }
  }, [user, isLoading]);

  if (isLoading) return null;

  return (
    <TeacherThemeProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </TeacherThemeProvider>
  );
}

