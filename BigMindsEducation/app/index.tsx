import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { colors, typography, spacing, borderRadius, shadows, responsive } from './theme/colors';

const { width, height } = Dimensions.get('window');

const features = [
  {
    icon: '🎓',
    title: 'Expert Teachers',
    description: 'Learn from industry professionals and certified educators',
  },
  {
    icon: '💬',
    title: 'Interactive Forums',
    description: 'Join discussions and collaborate with peers worldwide',
  },
  {
    icon: '🏆',
    title: 'Gamified Learning',
    description: 'Earn points, badges, and climb the leaderboard',
  },
  {
    icon: '📱',
    title: 'Mobile First',
    description: 'Learn anywhere, anytime with our mobile-optimized platform',
  },
];

export default function LandingScreen() {
  // Animation values
  const heroOpacity = useSharedValue(0);
  const heroTranslateY = useSharedValue(50);
  const featuresOpacity = useSharedValue(0);
  const featuresTranslateY = useSharedValue(30);
  const buttonScale = useSharedValue(1);
  const floatingAnimation = useSharedValue(0);

  // Responsive values
  const isSmallDevice = responsive.isSmallDevice(width);
  const isLargeDevice = responsive.isLargeDevice(width);
  const responsiveSpacing = responsive.getSpacing(spacing.lg, width);
  const responsivePadding = responsive.getPadding(spacing.lg, width);

  useEffect(() => {
    // Start animations
    heroOpacity.value = withTiming(1, { duration: 1000 });
    heroTranslateY.value = withSpring(0, { damping: 15, stiffness: 100 });

    // Animate features after hero
    setTimeout(() => {
      featuresOpacity.value = withTiming(1, { duration: 800 });
      featuresTranslateY.value = withSpring(0, { damping: 15, stiffness: 100 });
    }, 300);

    // Floating animation
    floatingAnimation.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000 }),
        withTiming(0, { duration: 2000 })
      ),
      -1,
      true
    );
  }, []);

  // Animated styles
  const heroAnimatedStyle = useAnimatedStyle(() => ({
    opacity: heroOpacity.value,
    transform: [{ translateY: heroTranslateY.value }],
  }));

  const featuresAnimatedStyle = useAnimatedStyle(() => ({
    opacity: featuresOpacity.value,
    transform: [{ translateY: featuresTranslateY.value }],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const floatingStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          floatingAnimation.value,
          [0, 1],
          [0, -10],
          Extrapolate.CLAMP
        ),
      },
    ],
  }));

  const handleButtonPress = () => {
    buttonScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );
    setTimeout(() => router.push('/auth'), 200);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="dark" />

      {/* Hero Section */}
      <View style={{
        backgroundColor: colors.primary,
        height: isSmallDevice ? height * 0.45 : height * 0.5,
        borderBottomLeftRadius: isSmallDevice ? 24 : 32,
        borderBottomRightRadius: isSmallDevice ? 24 : 32,
        ...shadows.lg,
      }}>
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: responsivePadding
        }}>
          <Animated.View style={[heroAnimatedStyle, floatingStyle, { alignItems: 'center' }]}>
            {/* Logo/Icon */}
            <View style={{
              width: isSmallDevice ? 80 : 100,
              height: isSmallDevice ? 80 : 100,
              backgroundColor: colors.surface,
              borderRadius: borderRadius.full,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: responsiveSpacing,
              ...shadows.md,
            }}>
              <Text style={{ fontSize: isSmallDevice ? 40 : 48 }}>🧠</Text>
            </View>

            {/* Title */}
            <Text style={{
              fontSize: responsive.getFontSize(32, width),
              fontWeight: 'bold',
              color: colors.surface,
              textAlign: 'center',
              marginBottom: spacing.sm
            }}>
              BigMinds
            </Text>
            <Text style={{
              fontSize: responsive.getFontSize(16, width),
              color: colors.surface,
              textAlign: 'center',
              marginBottom: responsive.getSpacing(spacing.xl, width),
              opacity: 0.9,
            }}>
              Where Learning Meets Innovation
            </Text>

            {/* CTA Button */}
            <Animated.View style={buttonAnimatedStyle}>
              <TouchableOpacity
                onPress={handleButtonPress}
                style={{
                  backgroundColor: colors.surface,
                  paddingHorizontal: responsive.getPadding(spacing.xl, width),
                  paddingVertical: responsivePadding,
                  borderRadius: borderRadius.lg,
                  ...shadows.md,
                }}
              >
                <Text style={{
                  fontSize: responsive.getFontSize(16, width),
                  fontWeight: '600',
                  color: colors.primary,
                }}>
                  Get Started
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </View>
      </View>

      {/* Features Section */}
      <ScrollView
        style={{ flex: 1, paddingHorizontal: responsivePadding }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: responsive.getSpacing(spacing.xxl, width) }}
      >
        <Animated.View style={featuresAnimatedStyle}>
          {/* Features Grid */}
          <View style={{ marginTop: responsive.getSpacing(spacing.lg, width) }}>
            {features.map((feature, index) => (
              <View
                key={index}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: borderRadius.lg,
                  padding: responsivePadding,
                  marginBottom: responsive.getSpacing(spacing.md, width),
                  ...shadows.md,
                }}
              >
                <View style={{
                  flexDirection: isSmallDevice ? 'column' : 'row',
                  alignItems: isSmallDevice ? 'center' : 'flex-start',
                  gap: isSmallDevice ? spacing.sm : 0,
                }}>
                  <View style={{
                    width: isSmallDevice ? 50 : 60,
                    height: isSmallDevice ? 50 : 60,
                    backgroundColor: colors.primary,
                    borderRadius: borderRadius.md,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: isSmallDevice ? 0 : spacing.md,
                    marginBottom: isSmallDevice ? spacing.sm : 0,
                  }}>
                    <Text style={{ fontSize: isSmallDevice ? 20 : 24 }}>{feature.icon}</Text>
                  </View>
                  <View style={{ flex: 1, alignItems: isSmallDevice ? 'center' : 'flex-start' }}>
                    <Text style={{
                      fontSize: responsive.getFontSize(20, width),
                      fontWeight: '600',
                      marginBottom: spacing.xs,
                      textAlign: isSmallDevice ? 'center' : 'left',
                    }}>
                      {feature.title}
                    </Text>
                    <Text style={{
                      fontSize: responsive.getFontSize(14, width),
                      color: colors.textSecondary,
                      textAlign: isSmallDevice ? 'center' : 'left',
                    }}>
                      {feature.description}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* Stats Section */}
          <View style={{ marginTop: responsive.getSpacing(spacing.xl, width) }}>
            <View style={{
              backgroundColor: colors.primary,
              borderRadius: borderRadius.lg,
              padding: responsivePadding,
              ...shadows.md,
            }}>
              <Text style={{
                fontSize: responsive.getFontSize(20, width),
                fontWeight: '600',
                color: colors.surface,
                textAlign: 'center',
                marginBottom: responsivePadding
              }}>
                Join Our Growing Community
              </Text>
              <View style={{
                flexDirection: isSmallDevice ? 'column' : 'row',
                justifyContent: isSmallDevice ? 'center' : 'space-around',
                gap: isSmallDevice ? spacing.md : 0,
              }}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{
                    fontSize: responsive.getFontSize(28, width),
                    fontWeight: 'bold',
                    color: colors.surface
                  }}>10K+</Text>
                  <Text style={{
                    fontSize: responsive.getFontSize(14, width),
                    color: colors.surface,
                    opacity: 0.8,
                  }}>Students</Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{
                    fontSize: responsive.getFontSize(28, width),
                    fontWeight: 'bold',
                    color: colors.surface
                  }}>500+</Text>
                  <Text style={{
                    fontSize: responsive.getFontSize(14, width),
                    color: colors.surface,
                    opacity: 0.8,
                  }}>Courses</Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{
                    fontSize: responsive.getFontSize(28, width),
                    fontWeight: 'bold',
                    color: colors.surface
                  }}>50+</Text>
                  <Text style={{
                    fontSize: responsive.getFontSize(14, width),
                    color: colors.surface,
                    opacity: 0.8,
                  }}>Teachers</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Bottom CTA */}
          <View style={{
            marginTop: responsive.getSpacing(spacing.xl, width),
            gap: responsive.getSpacing(spacing.md, width)
          }}>
            <TouchableOpacity
              onPress={() => router.push('/auth')}
              style={{
                backgroundColor: colors.primary,
                borderRadius: borderRadius.lg,
                paddingVertical: responsivePadding,
                alignItems: 'center',
                ...shadows.md,
              }}
            >
              <Text style={{
                fontSize: responsive.getFontSize(16, width),
                fontWeight: '600',
                color: colors.surface,
              }}>
                Start Learning Today
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/auth/login')}
              style={{
                borderWidth: 2,
                borderColor: colors.primary,
                borderRadius: borderRadius.lg,
                paddingVertical: responsivePadding,
                alignItems: 'center',
              }}
            >
              <Text style={{
                fontSize: responsive.getFontSize(16, width),
                fontWeight: '600',
                color: colors.primary,
              }}>
                Already have an account? Sign In
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
} 