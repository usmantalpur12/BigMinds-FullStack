import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTeacherTheme } from '../theme/teacherTheme';
import {
  TeacherButton,
  TeacherSkeleton,
  TeacherErrorBoundary,
  showTeacherToast,
} from './components';
import LottieView from 'lottie-react-native';
import EmptyAnimation from '../../assets/teacher-empty.json';
import { backendAPI } from '../services/backendAPI';
import { useAuth } from '../context/AuthContext';

interface Challenge {
  _id: string;
  title: string;
  description: string;
  category: string;
  type: string;
  xpReward: number;
  status: 'not_started' | 'in_progress' | 'completed';
  progress: any;
  requirements: any;
  participants?: number;
}

export default function TeacherChallengesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    theme: { spacing, text, typography, surface, radius, background, semantic },
  } = useTeacherTheme();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', name: 'All', icon: 'grid' },
    { id: 'course', name: 'Academic', icon: 'school' },
    { id: 'quiz', name: 'Quiz', icon: 'document-text' },
    { id: 'forum', name: 'Forum', icon: 'chatbubbles' },
    { id: 'special', name: 'Special', icon: 'star' },
  ];

  const userId = (user as any)?._id || (user as any)?.id;

  const loadChallenges = async () => {
    try {
      if (!refreshing) setLoading(true);
      const response = await backendAPI.get('/gamification/quests');
      
      if (response.data.success) {
        setChallenges(response.data.data || []);
      }
    } catch (error) {
      console.error('Error loading challenges:', error);
      showTeacherToast({ type: 'error', title: 'Failed to load challenges' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleStartChallenge = async (challengeId: string) => {
    try {
      const response = await backendAPI.post(`/gamification/quests/${userId}/start`, {
        questId: challengeId
      });

      if (response.data.success) {
        showTeacherToast({ 
          type: 'success', 
          title: 'Challenge Started', 
          message: 'Good luck with your new challenge!' 
        });
        loadChallenges();
      }
    } catch (error: any) {
      console.error('Error starting challenge:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to start challenge');
    }
  };

  useEffect(() => {
    loadChallenges();
  }, []);

  const calculateProgress = (challenge: Challenge) => {
    if (challenge.status === 'completed') return 100;
    if (challenge.status === 'not_started') return 0;

    const requirements = challenge.requirements || {};
    const progress = challenge.progress || {};
    
    const keys = Object.keys(requirements);
    if (keys.length === 0) return 0;

    let totalProgress = 0;
    keys.forEach(key => {
      const target = requirements[key] || 0;
      const current = progress[key] || 0;
      totalProgress += Math.min(1, current / target);
    });

    return Math.round((totalProgress / keys.length) * 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return semantic.success.default;
      case 'in_progress':
        return semantic.primary.default;
      default:
        return text.secondary;
    }
  };

  const filteredChallenges = selectedCategory === 'all'
    ? challenges
    : challenges.filter(c => c.category === selectedCategory || c.type === selectedCategory);

  return (
    <TeacherErrorBoundary>
      <View style={{ flex: 1, backgroundColor: background.default }}>
        <View
          style={{
            backgroundColor: semantic.primary.default,
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.xl,
            paddingBottom: spacing.lg,
            borderBottomLeftRadius: radius.xl,
            borderBottomRightRadius: radius.xl,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 8,
            marginBottom: spacing.md,
          }}
        >
          <Text
            style={{
              fontFamily: typography.fontFamily.bold,
              fontSize: 28,
              color: '#FFFFFF',
              marginBottom: spacing.xs,
              letterSpacing: 0.5,
            }}
          >
            Teacher Challenges
          </Text>
          <Text
            style={{
              fontFamily: typography.fontFamily.medium,
              fontSize: 14,
              color: 'rgba(255, 255, 255, 0.9)',
            }}
          >
            Complete challenges to earn points and unlock achievements
          </Text>
        </View>

        {/* Category Filter */}
        <View style={{ 
          backgroundColor: surface.default, 
          borderBottomWidth: 1, 
          borderBottomColor: surface.border,
          height: 60, // Explicit height to prevent clipping
          justifyContent: 'center'
        }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: spacing.lg,
              alignItems: 'center',
              gap: spacing.sm,
            }}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                onPress={() => setSelectedCategory(category.id)}
                style={{
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  borderRadius: radius.full,
                  backgroundColor:
                    selectedCategory === category.id
                      ? semantic.primary.default
                      : surface.muted,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.xs,
                  borderWidth: 1,
                  borderColor: selectedCategory === category.id ? semantic.primary.default : surface.border,
                }}
              >
                <Ionicons
                  name={category.icon as any}
                  size={16}
                  color={
                    selectedCategory === category.id
                      ? semantic.primary.contrastText
                      : text.secondary
                  }
                />
                <Text
                  style={{
                    fontFamily: typography.fontFamily.medium,
                    fontSize: typography.sizes.sm,
                    color:
                      selectedCategory === category.id
                        ? semantic.primary.contrastText
                        : text.secondary,
                  }}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadChallenges();
              }}
            />
          }
        >
          {loading ? (
            <View style={{ gap: spacing.md }}>
              {Array.from({ length: 3 }).map((_, idx) => (
                <TeacherSkeleton key={idx} height={150} />
              ))}
            </View>
          ) : filteredChallenges.length === 0 ? (
            <View style={{ alignItems: 'center', marginTop: spacing.xl }}>
              <LottieView
                source={EmptyAnimation}
                autoPlay
                loop
                style={{ width: 200, height: 200 }}
              />
              <Text
                style={{
                  color: text.secondary,
                  marginTop: spacing.md,
                  fontFamily: typography.fontFamily.medium,
                }}
              >
                No challenges available
              </Text>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
              {filteredChallenges.map((challenge) => {
                const progress = calculateProgress(challenge);
                return (
                  <TouchableOpacity
                    key={challenge._id}
                    onPress={() => {
                      if (challenge.status === 'not_started') {
                        handleStartChallenge(challenge._id);
                      }
                    }}
                    style={{
                      width: '48%',
                      backgroundColor: surface.default,
                      borderRadius: radius.xl,
                      padding: spacing.md,
                      borderWidth: 1,
                      borderColor: challenge.status === 'in_progress' ? semantic.primary.default : surface.border,
                      gap: spacing.sm,
                      elevation: challenge.status === 'in_progress' ? 4 : 0,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontFamily: typography.fontFamily.semibold,
                            fontSize: typography.sizes.md,
                            color: text.primary,
                            marginBottom: spacing.xs,
                          }}
                          numberOfLines={2}
                        >
                          {challenge.title}
                        </Text>
                        <Text
                          style={{
                            fontFamily: typography.fontFamily.regular,
                            fontSize: typography.sizes.xs,
                            color: text.secondary,
                          }}
                          numberOfLines={3}
                        >
                          {challenge.description}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: spacing.sm,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: spacing.xs,
                        }}
                      >
                        <Ionicons
                          name="trophy"
                          size={14}
                          color={semantic.warning.default}
                        />
                        <Text
                          style={{
                            fontFamily: typography.fontFamily.medium,
                            fontSize: typography.sizes.xs,
                            color: text.primary,
                          }}
                        >
                          {challenge.xpReward} XP
                        </Text>
                      </View>
                      
                      <View
                        style={{
                          backgroundColor: getStatusColor(challenge.status) + '20',
                          paddingHorizontal: spacing.xs,
                          paddingVertical: 2,
                          borderRadius: radius.sm,
                        }}
                      >
                        <Text
                          style={{
                            fontFamily: typography.fontFamily.semibold,
                            fontSize: 10,
                            color: getStatusColor(challenge.status),
                            textTransform: 'uppercase',
                          }}
                        >
                          {challenge.status.replace('_', ' ')}
                        </Text>
                      </View>
                    </View>

                    {challenge.status !== 'not_started' && (
                      <View style={{ marginTop: spacing.sm }}>
                        <View
                          style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            marginBottom: spacing.xs,
                          }}
                        >
                          <Text
                            style={{
                              fontFamily: typography.fontFamily.medium,
                              fontSize: 10,
                              color: text.secondary,
                            }}
                          >
                            Progress
                          </Text>
                          <Text
                            style={{
                              fontFamily: typography.fontFamily.semibold,
                              fontSize: 10,
                              color: text.primary,
                            }}
                          >
                            {progress}%
                          </Text>
                        </View>
                        <View
                          style={{
                            height: 4,
                            backgroundColor: surface.muted,
                            borderRadius: radius.full,
                            overflow: 'hidden',
                          }}
                        >
                          <View
                            style={{
                              height: '100%',
                              width: `${progress}%`,
                              backgroundColor: challenge.status === 'completed' ? semantic.success.default : semantic.primary.default,
                              borderRadius: radius.full,
                            }}
                          />
                        </View>
                      </View>
                    )}

                    <TeacherButton
                      title={
                        challenge.status === 'completed'
                          ? 'Done'
                          : challenge.status === 'in_progress'
                            ? 'Continue'
                            : 'Start'
                      }
                      variant={challenge.status === 'completed' ? 'outline' : 'primary'}
                      fullWidth
                      icon={challenge.status === 'completed' ? 'checkmark-circle' : 'play'}
                      style={{ marginTop: spacing.xs }}
                      disabled={challenge.status === 'completed'}
                      onPress={() => {
                        if (challenge.status === 'not_started') {
                          handleStartChallenge(challenge._id);
                        }
                      }}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>
    </TeacherErrorBoundary>
  );
}
