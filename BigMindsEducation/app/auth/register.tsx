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
import { router, useLocalSearchParams } from 'expo-router';
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
import { colors, typography, spacing, borderRadius, shadows, responsive } from '../theme/colors';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get('window');

export default function RegisterScreen() {
  const { register, isLoading, error, clearError } = useAuth();
  const params = useLocalSearchParams<{ role?: string }>();
  const initialRole = (params.role === 'teacher' ? 'teacher' : 'student') as 'student' | 'teacher';
  const [formData, setFormData] = useState({ 
    firstName: '', 
    lastName: '', 
    email: '', 
    password: '', 
    confirmPassword: '',
    role: initialRole,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      // Alert.alert('Error', 'Please enter your first name');
      return false;
    }
    if (!formData.lastName.trim()) {
      // Alert.alert('Error', 'Please enter your last name');
      return false;
    }
    
    if (!formData.email.trim()) {
      // Alert.alert('Error', 'Please enter your email address');
      return false;
    }
    
    if (!formData.email.includes('@')) {
      // Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }
    
    if (formData.password.length < 6) {
      // Alert.alert('Error', 'Password must be at least 6 characters long');
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      // Alert.alert('Error', 'Passwords do not match');
      return false;
    }
    
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    
    buttonScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );
    
    try {
      await register({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        role: formData.role,
      });
    } catch (error) {
      console.error('Registration error:', error);
    }
  };

  const handleBackPress = () => {
    buttonScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );
    setTimeout(() => router.back(), 200);
  };

  const roles = [
    { id: 'student', title: 'Student', icon: '🎓', description: 'Learn and grow with courses' },
    { id: 'teacher', title: 'Teacher', icon: '👨‍🏫', description: 'Create and manage courses' },
  ];

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
                Join BigMinds!
              </Text>
              <Text style={{ 
                fontSize: responsive.getFontSize(14, width),
                color: colors.surface,
                opacity: 0.9,
                textAlign: 'center',
              }}>
                Create your account
              </Text>
            </View>
            
            <View style={{ width: isSmallDevice ? 36 : 40 }} />
          </Animated.View>
        </View>

        {/* Registration Form */}
        <Animated.View style={[formAnimatedStyle, { 
          flex: 1, 
          paddingHorizontal: responsivePadding,
          paddingTop: responsiveSpacing,
        }]}>
          <View style={{ 
            backgroundColor: colors.surface, 
            borderRadius: borderRadius.lg,
            padding: responsivePadding,
            ...shadows.md,
            borderWidth: 1,
            borderColor: colors.border,
          }}>
              {/* Full Name Input */}
            <View style={{ marginBottom: responsive.getSpacing(spacing.lg, width) }}>
              <Text style={{ 
                fontSize: responsive.getFontSize(16, width),
                fontWeight: '600', 
                color: colors.textPrimary, 
                marginBottom: spacing.sm 
              }}>
                First Name
              </Text>
              <TextInput
                style={{ 
                  borderWidth: 1, 
                  borderColor: colors.border, 
                  borderRadius: borderRadius.md, 
                  padding: responsivePadding, 
                  fontSize: responsive.getFontSize(16, width), 
                  backgroundColor: colors.background,
                  color: colors.textPrimary,
                }}
                placeholder="Enter your first name"
                placeholderTextColor={colors.textLight}
                value={formData.firstName}
                onChangeText={(text) => setFormData(prev => ({ ...prev, firstName: text }))}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>

            {/* Last Name Input */}
            <View style={{ marginBottom: responsive.getSpacing(spacing.lg, width) }}>
              <Text style={{ 
                marginBottom: spacing.sm, 
                ...typography.label 
              }}>
                Last Name
              </Text>
              <TextInput
                style={{ 
                  borderWidth: 1, 
                  borderColor: colors.border, 
                  borderRadius: borderRadius.md, 
                  padding: responsivePadding, 
                  fontSize: responsive.getFontSize(16, width), 
                  backgroundColor: colors.background,
                  color: colors.textPrimary,
                }}
                placeholder="Enter your last name"
                placeholderTextColor={colors.textLight}
                value={formData.lastName}
                onChangeText={(text) => setFormData(prev => ({ ...prev, lastName: text }))}
                autoCapitalize="words"
                autoCorrect={false}
              />
            </View>

              {/* Email Input */}
            <View style={{ marginBottom: responsive.getSpacing(spacing.lg, width) }}>
              <Text style={{ 
                fontSize: responsive.getFontSize(16, width),
                fontWeight: '600', 
                color: colors.textPrimary, 
                marginBottom: spacing.sm 
              }}>
                Email Address
              </Text>
                <TextInput
                style={{ 
                  borderWidth: 1, 
                  borderColor: colors.border, 
                  borderRadius: borderRadius.md, 
                  padding: responsivePadding, 
                  fontSize: responsive.getFontSize(16, width), 
                  backgroundColor: colors.background,
                  color: colors.textPrimary,
                }}
                placeholder="Enter your email"
                placeholderTextColor={colors.textLight}
                  value={formData.email}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                  keyboardType="email-address"
                  autoCapitalize="none"
                autoCorrect={false}
                />
              </View>

              {/* Password Input */}
            <View style={{ marginBottom: responsive.getSpacing(spacing.lg, width) }}>
              <Text style={{ 
                fontSize: responsive.getFontSize(16, width),
                fontWeight: '600', 
                color: colors.textPrimary, 
                marginBottom: spacing.sm 
              }}>
                Password
              </Text>
              <View style={{ position: 'relative' }}>
                <TextInput
                  style={{ 
                    borderWidth: 1, 
                    borderColor: colors.border, 
                    borderRadius: borderRadius.md, 
                    padding: responsivePadding, 
                    paddingRight: 50,
                    fontSize: responsive.getFontSize(16, width), 
                    backgroundColor: colors.background,
                    color: colors.textPrimary,
                  }}
                  placeholder="Create a password (min 6 characters)"
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
                  <Text style={{ fontSize: 18, color: colors.textLight }}>
                    {showPassword ? '🙈' : '👁️'}
                  </Text>
                </TouchableOpacity>
              </View>
              </View>

              {/* Confirm Password Input */}
            <View style={{ marginBottom: responsive.getSpacing(spacing.lg, width) }}>
              <Text style={{ 
                fontSize: responsive.getFontSize(16, width),
                fontWeight: '600', 
                color: colors.textPrimary, 
                marginBottom: spacing.sm 
              }}>
                Confirm Password
              </Text>
              <View style={{ position: 'relative' }}>
                <TextInput
                  style={{ 
                    borderWidth: 1, 
                    borderColor: colors.border, 
                    borderRadius: borderRadius.md, 
                    padding: responsivePadding, 
                    paddingRight: 50,
                    fontSize: responsive.getFontSize(16, width), 
                    backgroundColor: colors.background,
                    color: colors.textPrimary,
                  }}
                  placeholder="Confirm your password"
                  placeholderTextColor={colors.textLight}
                  value={formData.confirmPassword}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, confirmPassword: text }))}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute',
                    right: 16,
                    top: 0,
                    bottom: 0,
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 18, color: colors.textLight }}>
                    {showConfirmPassword ? '🙈' : '👁️'}
                  </Text>
                </TouchableOpacity>
              </View>
              </View>

              {/* Role Selection */}
            <View style={{ marginBottom: responsive.getSpacing(spacing.lg, width) }}>
              <Text style={{ 
                fontSize: responsive.getFontSize(16, width),
                fontWeight: '600', 
                color: colors.textPrimary, 
                marginBottom: responsivePadding 
              }}>
                I want to join as:
              </Text>
              <View style={{ 
                flexDirection: isSmallDevice ? 'column' : 'row', 
                gap: responsive.getSpacing(spacing.sm, width) 
              }}>
                  {roles.map((role) => (
                    <TouchableOpacity
                      key={role.id}
                    onPress={() => setFormData(prev => ({ ...prev, role: role.id as 'student' | 'teacher' }))}
                    style={{ flex: 1 }}
                  >
                    <View style={{ 
                      borderWidth: 2, 
                      borderColor: formData.role === role.id ? colors.primary : colors.border, 
                      borderRadius: borderRadius.md,
                      padding: responsivePadding,
                      alignItems: 'center',
                      backgroundColor: formData.role === role.id ? colors.primary + '10' : colors.background,
                    }}>
                      <Text style={{ 
                        fontSize: isSmallDevice ? 20 : 24, 
                        marginBottom: spacing.xs 
                      }}>{role.icon}</Text>
                      <Text style={{ 
                        fontSize: responsive.getFontSize(14, width),
                        fontWeight: '600', 
                        color: formData.role === role.id ? colors.primary : colors.textSecondary,
                        marginBottom: spacing.xs,
                      }}>
                            {role.title}
                          </Text>
                      <Text style={{ 
                        fontSize: responsive.getFontSize(12, width),
                        color: formData.role === role.id ? colors.primary : colors.textLight,
                        textAlign: 'center',
                      }}>
                        {role.description}
                      </Text>
                    </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Register Button */}
            <TouchableOpacity
                  onPress={handleRegister}
                  disabled={isLoading}
              style={{ 
                backgroundColor: colors.primary, 
                borderRadius: borderRadius.md, 
                padding: responsivePadding, 
                alignItems: 'center', 
                marginBottom: responsive.getSpacing(spacing.lg, width),
                opacity: isLoading ? 0.7 : 1,
                ...shadows.sm,
              }}
            >
              <Text style={{ 
                fontSize: responsive.getFontSize(16, width),
                fontWeight: '600', 
                color: colors.surface,
              }}>
                  {isLoading ? 'Creating Account...' : 'Create Account'}
              </Text>
            </TouchableOpacity>

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

              {/* Login Button */}
            <TouchableOpacity
                onPress={() => router.push('/auth/login')}
              style={{ 
                borderWidth: 2, 
                borderColor: colors.primary, 
                borderRadius: borderRadius.md, 
                padding: responsivePadding, 
                alignItems: 'center' 
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

          {/* Terms Info */}
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
              <Text style={{ 
                fontSize: responsive.getFontSize(12, width),
                color: colors.textSecondary,
                textAlign: 'center',
                lineHeight: 20,
              }}>
                  By creating an account, you agree to our{' '}
                <Text style={{ color: colors.primary, fontWeight: '600' }}>Terms of Service</Text>
                  {' '}and{' '}
                <Text style={{ color: colors.primary, fontWeight: '600' }}>Privacy Policy</Text>
                </Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
} 