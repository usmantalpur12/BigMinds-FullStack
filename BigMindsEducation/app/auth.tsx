import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { colors, typography, spacing, borderRadius, shadows, responsive } from './theme/colors';

const { width, height } = Dimensions.get('window');

const roles = [
  {
    id: 'student',
    title: 'Student',
    subtitle: 'Learn & Grow',
    icon: '🎓',
    description: 'Access courses, join forums, and track your progress',
  },
  {
    id: 'teacher',
    title: 'Teacher',
    subtitle: 'Educate & Inspire',
    icon: '👨‍🏫',
    description: 'Create courses, manage forums, and guide students',
  },
];

export default function AuthScreen() {
  // Animation values
  const containerOpacity = useSharedValue(0);
  const containerTranslateY = useSharedValue(30);
  const cardsOpacity = useSharedValue(0);
  const cardsTranslateY = useSharedValue(50);
  const buttonScale = useSharedValue(1);

  // Responsive values
  const isSmallDevice = responsive.isSmallDevice(width);
  const isLargeDevice = responsive.isLargeDevice(width);
  const responsiveSpacing = responsive.getSpacing(spacing.lg, width);
  const responsivePadding = responsive.getPadding(spacing.lg, width);

  useEffect(() => {
    // Start animations
    containerOpacity.value = withTiming(1, { duration: 800 });
    containerTranslateY.value = withSpring(0, { damping: 15, stiffness: 100 });

    // Animate cards after container
    setTimeout(() => {
      cardsOpacity.value = withTiming(1, { duration: 600 });
      cardsTranslateY.value = withSpring(0, { damping: 15, stiffness: 100 });
    }, 200);
  }, []);

  // Animated styles
  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
    transform: [{ translateY: containerTranslateY.value }],
  }));

  const cardsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardsOpacity.value,
    transform: [{ translateY: cardsTranslateY.value }],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handleRoleSelect = (roleId: string) => {
    buttonScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );
    
    setTimeout(() => {
      router.push(`/auth/register?role=${roleId}`);
    }, 200);
  };

  const handleBackPress = () => {
    buttonScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );
    setTimeout(() => router.back(), 200);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={{ 
        paddingTop: responsive.getPadding(spacing.xxl, width), 
        paddingBottom: responsivePadding, 
        paddingHorizontal: responsivePadding,
        backgroundColor: colors.primary,
        borderBottomLeftRadius: isSmallDevice ? 16 : 24,
        borderBottomRightRadius: isSmallDevice ? 16 : 24,
        ...shadows.md,
      }}>
        <Animated.View style={[containerAnimatedStyle, { 
          flexDirection: 'row', 
          alignItems: 'center', 
          justifyContent: 'space-between' 
        }]}>
          <TouchableOpacity
            onPress={handleBackPress}
            style={{ 
              width: isSmallDevice ? 36 : 40, 
              height: isSmallDevice ? 36 : 40, 
              backgroundColor: colors.surface, 
              borderRadius: borderRadius.full,
              alignItems: 'center', 
              justifyContent: 'center',
              ...shadows.sm,
            }}
          >
            <Text style={{ 
              color: colors.primary, 
              fontSize: isSmallDevice ? 18 : 20, 
              fontWeight: 'bold' 
            }}>←</Text>
          </TouchableOpacity>
          
          <View style={{ alignItems: 'center', flex: 1, paddingHorizontal: spacing.sm }}>
            <Text style={{ 
              fontSize: responsive.getFontSize(28, width),
              fontWeight: 'bold', 
              color: colors.surface,
              marginBottom: spacing.xs,
              textAlign: 'center',
            }}>
              Choose Your Role
            </Text>
            <Text style={{ 
              fontSize: responsive.getFontSize(14, width),
              color: colors.surface,
              opacity: 0.9,
              textAlign: 'center',
            }}>
              Select how you want to use BigMinds
            </Text>
          </View>
          
          <View style={{ width: isSmallDevice ? 36 : 40 }} />
        </Animated.View>
      </View>

      {/* Role Cards */}
      <Animated.View style={[cardsAnimatedStyle, { 
        flex: 1, 
        paddingHorizontal: responsivePadding,
        paddingTop: responsiveSpacing,
      }]}>
        <View style={{ gap: responsive.getSpacing(spacing.md, width) }}>
          {roles.map((role, index) => (
            <TouchableOpacity
              key={role.id}
              onPress={() => handleRoleSelect(role.id)}
              activeOpacity={0.8}
            >
              <View style={{ 
                backgroundColor: colors.surface, 
                borderRadius: borderRadius.lg,
                padding: responsivePadding,
                ...shadows.md,
                borderWidth: 1,
                borderColor: colors.border,
              }}>
                <View style={{ 
                  flexDirection: isSmallDevice ? 'column' : 'row', 
                  alignItems: isSmallDevice ? 'center' : 'flex-start',
                  gap: isSmallDevice ? spacing.sm : 0,
                }}>
                  {/* Icon */}
                  <View style={{ 
                    width: isSmallDevice ? 60 : 70, 
                    height: isSmallDevice ? 60 : 70, 
                    backgroundColor: colors.primary, 
                    borderRadius: borderRadius.md,
                    alignItems: 'center', 
                    justifyContent: 'center',
                    marginRight: isSmallDevice ? 0 : spacing.md,
                    marginBottom: isSmallDevice ? spacing.sm : 0,
                  }}>
                    <Text style={{ fontSize: isSmallDevice ? 24 : 28 }}>{role.icon}</Text>
                  </View>
                  
                  {/* Content */}
                  <View style={{ flex: 1, alignItems: isSmallDevice ? 'center' : 'flex-start' }}>
                    <Text style={{ 
                      fontSize: responsive.getFontSize(20, width),
                      fontWeight: '600', 
                      color: colors.textPrimary,
                      marginBottom: spacing.xs,
                      textAlign: isSmallDevice ? 'center' : 'left',
                    }}>
                      {role.title}
                    </Text>
                    <Text style={{ 
                      fontSize: responsive.getFontSize(14, width),
                      color: colors.primary,
                      fontWeight: '600',
                      marginBottom: spacing.xs,
                      textAlign: isSmallDevice ? 'center' : 'left',
                    }}>
                      {role.subtitle}
                    </Text>
                    <Text style={{ 
                      fontSize: responsive.getFontSize(14, width),
                      color: colors.textSecondary,
                      lineHeight: 20,
                      textAlign: isSmallDevice ? 'center' : 'left',
                    }}>
                      {role.description}
                    </Text>
                  </View>
                  
                  {/* Arrow */}
                  {!isSmallDevice && (
                    <View style={{ 
                      width: 32, 
                      height: 32, 
                      backgroundColor: colors.primary, 
                      borderRadius: borderRadius.full,
                      alignItems: 'center', 
                      justifyContent: 'center',
                    }}>
                      <Text style={{ color: colors.surface, fontSize: 16, fontWeight: 'bold' }}>→</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bottom Info */}
        <View style={{ 
          marginTop: responsive.getSpacing(spacing.xl, width), 
          marginBottom: responsivePadding 
        }}>
          <View style={{ 
            backgroundColor: colors.surface, 
            borderRadius: borderRadius.lg,
            padding: responsivePadding,
            ...shadows.sm,
            borderWidth: 1,
            borderColor: colors.border,
          }}>
            <View style={{ 
              flexDirection: isSmallDevice ? 'column' : 'row', 
              alignItems: isSmallDevice ? 'center' : 'flex-start',
              marginBottom: spacing.sm,
              gap: isSmallDevice ? spacing.sm : 0,
            }}>
              <View style={{ 
                width: 32, 
                height: 32, 
                backgroundColor: colors.success, 
                borderRadius: borderRadius.full,
                alignItems: 'center', 
                justifyContent: 'center',
                marginRight: isSmallDevice ? 0 : spacing.sm,
              }}>
                <Text style={{ color: colors.surface, fontSize: 14, fontWeight: 'bold' }}>✓</Text>
              </View>
              <Text style={{ 
                fontSize: responsive.getFontSize(20, width),
                fontWeight: '600', 
                color: colors.textPrimary,
                textAlign: isSmallDevice ? 'center' : 'left',
              }}>
                Secure & Private
              </Text>
            </View>
            <Text style={{ 
              fontSize: responsive.getFontSize(14, width),
              color: colors.textSecondary,
              lineHeight: 20,
              textAlign: isSmallDevice ? 'center' : 'left',
            }}>
              Your data is protected with enterprise-grade security. 
              Choose your role to get started with personalized learning experience.
            </Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
} 