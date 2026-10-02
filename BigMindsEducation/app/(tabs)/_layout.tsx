import React from 'react';
import { Tabs } from 'expo-router';
import { Platform, Text, Dimensions } from 'react-native';
import { colors, typography, spacing, borderRadius, shadows, responsive } from '../theme/colors';

const { width } = Dimensions.get('window');
const isSmallDevice = responsive.isSmallDevice(width);

function TabBarIcon({ name, focused }: { name: string; focused: boolean }) {
  return (
    <Text style={{ 
      fontSize: isSmallDevice ? 20 : 24, 
      color: focused ? colors.primary : colors.textLight,
      marginBottom: 2,
    }}>
      {name}
    </Text>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingTop: isSmallDevice ? 8 : 12,
          paddingBottom: isSmallDevice ? 8 : 12,
          height: isSmallDevice ? 60 : 70,
          ...shadows.md,
        },
        tabBarLabelStyle: {
          fontSize: responsive.getFontSize(12, width),
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginBottom: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabBarIcon name="🏠" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="courses"
        options={{
          title: 'Courses',
          tabBarIcon: ({ focused }) => <TabBarIcon name="📚" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="forums"
        options={{
          title: 'Forums',
          tabBarIcon: ({ focused }) => <TabBarIcon name="💬" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="challenges"
        options={{
          title: 'Challenges',
          tabBarIcon: ({ focused }) => <TabBarIcon name="🎯" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'Leaderboard',
          tabBarIcon: ({ focused }) => <TabBarIcon name="🏆" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
} 