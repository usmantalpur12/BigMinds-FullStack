import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  Alert,
  Dimensions,
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
import { StatusBar } from 'expo-status-bar';
import { colors, typography, spacing, borderRadius, shadows, responsive, glassmorphism } from '../theme/colors';
import { ModernInput } from '../components/ModernInput';
import { ModernButton } from '../components/ModernButton';
import { GlassCard } from '../components/GlassCard';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { inputStyles } from '../theme/colors';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const { login, isLoading, error, clearError } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  // Animation values
  const containerOpacity = useSharedValue(0);
  const containerTranslateY = useSharedValue(30);
  const formOpacity = useSharedValue(0);
  const formTranslateY = useSharedValue(50);
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

    // Animate form after container
    setTimeout(() => {
      formOpacity.value = withTiming(1, { duration: 600 });
      formTranslateY.value = withSpring(0, { damping: 15, stiffness: 100 });
    }, 200);
  }, []);

  // Clear error when component mounts
  useEffect(() => {
    clearError();
  }, []);

  // Animated styles
  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
    transform: [{ translateY: containerTranslateY.value }],
  }));

  const formAnimatedStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
    transform: [{ translateY: formTranslateY.value }],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handleLogin = async () => {
    if (!formData.email || !formData.password) {
      // Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    buttonScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );
    
    try {
      await login({
        email: formData.email.trim(),
        password: formData.password,
      });
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleBackPress = () => {
    buttonScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );
    setTimeout(() => router.back(), 200);
  };

  const handleForgotPassword = () => {
    /* Alert.alert(
      'Forgot Password',
      'Enter your email to receive a password reset link.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Reset Link',
          onPress: () => {
            // In a real app, this would trigger password reset
            Alert.alert('Reset Link Sent', 'Check your email for password reset instructions.');
          },
        },
      ]
    ); */
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: colors.background }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" />
      
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ 
          paddingTop: responsive.getPadding(spacing.xxl, width), 
          paddingBottom: responsivePadding, 
          paddingHorizontal: responsivePadding,
          backgroundColor: colors.primary,
          borderBottomLeftRadius: isSmallDevice ? borderRadius.xl : borderRadius.xxl,
          borderBottomRightRadius: isSmallDevice ? borderRadius.xl : borderRadius.xxl,
          ...shadows.lg,
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
                ...glassmorphism.light,
                borderRadius: borderRadius.full,
                alignItems: 'center', 
                justifyContent: 'center',
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
                Welcome Back!
              </Text>
              <Text style={{ 
                fontSize: responsive.getFontSize(14, width),
                color: colors.surface,
                opacity: 0.9,
                textAlign: 'center',
              }}>
                Sign in to continue
              </Text>
            </View>
            
            <View style={{ width: isSmallDevice ? 36 : 40 }} />
          </Animated.View>
        </View>

        {/* Login Form */}
        <Animated.View style={[formAnimatedStyle, { 
          flex: 1, 
          paddingHorizontal: responsivePadding,
          paddingTop: responsiveSpacing,
        }]}>
          <GlassCard variant="medium" style={{ padding: responsivePadding }}>
            {/* Email Input */}
            <ModernInput
              label="Email Address"
              value={formData.email}
              onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              variant="glass"
            />

            {/* Password Input */}
            <View style={{ marginBottom: responsive.getSpacing(spacing.lg, width) }}>
              <Text style={{ 
                fontSize: responsive.getFontSize(14, width),
                fontWeight: '600', 
                color: colors.textSecondary, 
                marginBottom: spacing.xs 
              }}>
                Password
              </Text>
              <View style={{ position: 'relative' }}>
                <TextInput 
                  style={{ 
                    ...inputStyles.glass,
                    paddingRight: 50,
                  }}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.textLight}
                  value={formData.password}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: 16,
                    top: 0,
                    bottom: 0,
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons 
                    name={showPassword ? "eye-off" : "eye"} 
                    size={20} 
                    color={colors.textSecondary} 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity
              onPress={handleForgotPassword}
              style={{ alignSelf: 'flex-end', marginBottom: responsive.getSpacing(spacing.lg, width) }}
            >
              <Text style={{ 
                fontSize: responsive.getFontSize(14, width),
                color: colors.primary,
                fontWeight: '600',
              }}>
                Forgot Password?
              </Text>
            </TouchableOpacity>

            {/* Login Button */}
            <ModernButton
              title={isLoading ? 'Signing In...' : 'Sign In'}
              onPress={handleLogin}
              variant="primary"
              loading={isLoading}
              disabled={isLoading}
              fullWidth
              icon="log-in"
              style={{ marginBottom: responsive.getSpacing(spacing.lg, width) }}
            />

            {/* Divider */}
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              marginVertical: responsive.getSpacing(spacing.lg, width) 
            }}>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.divider }} />
              <Text style={{ 
                marginHorizontal: spacing.md, 
                color: colors.textLight,
                fontSize: responsive.getFontSize(14, width),
              }}>or</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.divider }} />
            </View>

            {/* Register Button */}
            <ModernButton
              title="Create New Account"
              onPress={() => router.push('/auth/register')}
              variant="secondary"
              fullWidth
              icon="person-add"
            />
          </GlassCard>

          {/* Demo Info */}
           <View style={{ 
            marginTop: responsive.getSpacing(spacing.lg, width), 
            marginBottom: responsive.getSpacing(spacing.xxl, width) 
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
                  backgroundColor: colors.warning, 
                  borderRadius: borderRadius.full,
                  alignItems: 'center', 
                  justifyContent: 'center',
                  marginRight: isSmallDevice ? 0 : spacing.sm,
                }}>
                  <Text style={{ color: colors.surface, fontSize: 14 }}>💡</Text>
                </View>
                <Text style={{ 
                  fontSize: responsive.getFontSize(20, width),
                  fontWeight: '600', 
                  color: colors.textPrimary,
                  textAlign: isSmallDevice ? 'center' : 'left',
                }}>
                  Demo Credentials
                </Text>
              </View>
              <Text style={{ 
                fontSize: responsive.getFontSize(14, width),
                color: colors.textSecondary,
                lineHeight: 20,
                textAlign: isSmallDevice ? 'center' : 'left',
                marginBottom: spacing.sm,
              }}>
                Use these credentials to test the app:
              </Text>
              <View style={{ gap: spacing.xs }}>
                <Text style={{ 
                  fontSize: responsive.getFontSize(12, width),
                  color: colors.textSecondary,
                  textAlign: isSmallDevice ? 'center' : 'left',
                }}>
                  <Text style={{ fontWeight: '600' }}>Student:</Text> sarah@example.com / password123
                </Text>
                <Text style={{ 
                  fontSize: responsive.getFontSize(12, width),
                  color: colors.textSecondary,
                  textAlign: isSmallDevice ? 'center' : 'left',
                }}>
                  <Text style={{ fontWeight: '600' }}>Teacher:</Text> john@example.com / password123
                </Text>
              </View>
            </View>
          </View> 
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
} 