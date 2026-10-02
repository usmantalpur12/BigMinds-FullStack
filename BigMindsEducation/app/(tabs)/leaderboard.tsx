import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Image,
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeInDown,
} from 'react-native-reanimated';
import { colors, spacing, borderRadius, shadows, responsive, glassmorphism } from '../theme/colors';
import { leaderboardService, LeaderboardCategory, LeaderboardEntry } from '../services/leaderboardService';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

// Leaderboard categories
const LEADERBOARD_CATEGORIES: { id: LeaderboardCategory; name: string; icon: string; description: string }[] = [
  { id: 'overall',    name: 'Overall',     icon: '🏆', description: 'Total XP earned'         },
  { id: 'courses',    name: 'Courses',     icon: '📚', description: 'Courses completed'        },
  { id: 'forums',     name: 'Forums',      icon: '💬', description: 'Forum posts made'         },
  { id: 'quizzes',    name: 'Quizzes',     icon: '📝', description: 'Quizzes passed'           },
  { id: 'study_time', name: 'Study Time',  icon: '⏱️', description: 'Minutes studied'         },
];

// ── Score Formatter ───────────────────────────────────────────────────────────
function formatScore(score: number, unit: string, label: string): string {
  switch (unit) {
    case 'xp':
      if (score >= 1000) return `${(score / 1000).toFixed(1)}k XP`;
      return `${score} XP`;
    case 'time':
      if (score >= 60) return `${Math.floor(score / 60)}h ${score % 60}m`;
      return `${score} min`;
    case 'streak':
      return `${score} day${score !== 1 ? 's' : ''}`;
    case 'level':
      return `Lv ${score}`;
    default:
      return `${score} ${label}`;
  }
}

// ── Rank helpers ──────────────────────────────────────────────────────────────
const RANK_ICONS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };
const RANK_COLORS: Record<number, string> = {
  1: '#FFD700',
  2: '#C0C0C0',
  3: '#CD7F32',
};

// ── Skeleton Row ──────────────────────────────────────────────────────────────
function SkeletonRow({ index }: { index: number }) {
  const opacity = useSharedValue(0.3);
  useEffect(() => {
    opacity.value = withTiming(1, { duration: 600 + index * 100 });
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View style={[style, {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.md,
      marginBottom: 10,
      gap: 12,
    }]}>
      <View style={{ width: 36, height: 20, backgroundColor: colors.border, borderRadius: 4 }} />
      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.border }} />
      <View style={{ flex: 1, gap: 6 }}>
        <View style={{ width: '60%', height: 14, backgroundColor: colors.border, borderRadius: 4 }} />
        <View style={{ width: '40%', height: 12, backgroundColor: colors.border, borderRadius: 4 }} />
      </View>
      <View style={{ width: 60, height: 18, backgroundColor: colors.border, borderRadius: 4 }} />
    </Animated.View>
  );
}

// ── Avatar Component ──────────────────────────────────────────────────────────
function UserAvatar({ avatar, name, size = 44 }: { avatar?: string; name: string; size?: number }) {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  if (avatar) {
    return (
      <Image
        source={{ uri: avatar }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        defaultSource={require('../../assets/icon.png')}
      />
    );
  }

  // Color seeded from name for consistent avatar color
  const hue = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  return (
    <View style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: `hsl(${hue}, 60%, 50%)`,
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <Text style={{ color: '#fff', fontWeight: '700', fontSize: size * 0.36 }}>{initials}</Text>
    </View>
  );
}

// ── Leaderboard Row ───────────────────────────────────────────────────────────
function LeaderboardRow({
  entry,
  index,
  isCurrentUser,
}: {
  entry: LeaderboardEntry;
  index: number;
  isCurrentUser: boolean;
}) {
  const rankIcon = RANK_ICONS[entry.rank];
  const rankColor = RANK_COLORS[entry.rank] ?? colors.textSecondary;
  const isTop3 = entry.rank <= 3;

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 60).springify()}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        backgroundColor: isCurrentUser
          ? colors.primary + '18'
          : isTop3
          ? colors.primary + '0D'
          : colors.surface,
        borderRadius: borderRadius.md,
        borderWidth: isCurrentUser ? 2 : isTop3 ? 1.5 : 1,
        borderColor: isCurrentUser
          ? colors.primary
          : isTop3
          ? colors.primary + '40'
          : colors.border,
        marginBottom: 10,
        ...shadows.sm,
      }}
    >
      {/* Rank */}
      <View style={{ width: 38, alignItems: 'center' }}>
        {rankIcon ? (
          <Text style={{ fontSize: 22 }}>{rankIcon}</Text>
        ) : (
          <Text style={{ fontSize: 16, fontWeight: '700', color: rankColor }}>
            #{entry.rank}
          </Text>
        )}
      </View>

      {/* Avatar */}
      <View style={{ marginRight: 12 }}>
        <UserAvatar avatar={entry.avatar} name={entry.name} />
      </View>

      {/* Name & meta */}
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text
            numberOfLines={1}
            style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary, flexShrink: 1 }}
          >
            {entry.name}
          </Text>
          {isCurrentUser && (
            <View style={{
              backgroundColor: colors.primary,
              borderRadius: 6,
              paddingHorizontal: 5,
              paddingVertical: 1,
            }}>
              <Text style={{ color: '#fff', fontSize: 9, fontWeight: '700' }}>YOU</Text>
            </View>
          )}
        </View>
        <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
          {`Lv ${entry.level} • 🔥 ${entry.streak}d streak`}
        </Text>
      </View>

      {/* Score */}
      <View style={{ alignItems: 'flex-end', minWidth: 72 }}>
        <Text style={{
          fontSize: 15,
          fontWeight: '800',
          color: isTop3 ? RANK_COLORS[entry.rank] ?? colors.primary : colors.primary,
        }}>
          {formatScore(entry.score, entry.scoreUnit, entry.scoreLabel)}
        </Text>
        <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
          {entry.xp >= 1000 ? `${(entry.xp / 1000).toFixed(1)}k XP` : `${entry.xp} XP`}
        </Text>
      </View>
    </Animated.View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function LeaderboardScreen() {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<LeaderboardCategory>('overall');
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Animation values
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-30);

  const isSmallDevice = width < 375;
  const responsivePadding = responsive.getPadding(spacing.lg, width);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 600 });
    headerTranslateY.value = withSpring(0, { damping: 15, stiffness: 90 });
  }, []);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const fetchLeaderboard = useCallback(async (withLoader = true) => {
    try {
      if (withLoader) setLoading(true);
      setError(null);
      const data = await leaderboardService.getLeaderboard(selectedCategory, 10);
      setLeaderboardData(data);
    } catch (err: any) {
      setError('Failed to load leaderboard. Please try again.');
      console.error('[Leaderboard] Fetch error:', err?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    setLeaderboardData([]); // Clear while loading new category
    fetchLeaderboard();
  }, [selectedCategory]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchLeaderboard(false);
  }, [fetchLeaderboard]);

  const currentUserId = (user as any)?._id || (user as any)?.id;

  const activeCategoryInfo = LEADERBOARD_CATEGORIES.find(c => c.id === selectedCategory)!;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ExpoStatusBar style="light" />
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* ── Header ── */}
      <Animated.View style={[{
        backgroundColor: colors.primary,
        paddingTop: 50,
        paddingHorizontal: responsivePadding,
        paddingBottom: responsivePadding + 8,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        ...shadows.lg,
      }, headerAnimatedStyle]}>
        <Text style={{
          fontSize: responsive.getFontSize(28, width),
          fontWeight: '800',
          color: '#fff',
          textAlign: 'center',
          letterSpacing: 0.5,
        }}>
          🏆 Leaderboard
        </Text>
        <Text style={{
          fontSize: responsive.getFontSize(14, width),
          color: 'rgba(255,255,255,0.85)',
          textAlign: 'center',
          marginTop: 4,
        }}>
          Top performers in the BigMinds community
        </Text>

        {/* Category Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingTop: 16, paddingBottom: 2 }}
        >
          {LEADERBOARD_CATEGORIES.map(cat => {
            const isActive = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setSelectedCategory(cat.id)}
                activeOpacity={0.75}
                style={{
                  backgroundColor: isActive ? '#fff' : 'rgba(255,255,255,0.20)',
                  borderRadius: borderRadius.xl,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                  borderWidth: 1.5,
                  borderColor: isActive ? '#fff' : 'rgba(255,255,255,0.35)',
                }}
              >
                <Text style={{ fontSize: isSmallDevice ? 14 : 16 }}>{cat.icon}</Text>
                <Text style={{
                  fontSize: responsive.getFontSize(12, width),
                  fontWeight: '700',
                  color: isActive ? colors.primary : '#fff',
                }}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </Animated.View>

      {/* ── Content ── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: responsivePadding, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Category info bar */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
          marginTop: 4,
        }}>
          <View>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textPrimary }}>
              {activeCategoryInfo.icon} {activeCategoryInfo.name} Rankings
            </Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
              {activeCategoryInfo.description}
            </Text>
          </View>
          {!loading && (
            <View style={{
              backgroundColor: colors.primary + '15',
              borderRadius: borderRadius.sm,
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderWidth: 1,
              borderColor: colors.primary + '30',
            }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>
                Top {leaderboardData.length}
              </Text>
            </View>
          )}
        </View>

        {/* Error State */}
        {error && !loading && (
          <View style={{
            backgroundColor: '#FEF2F2',
            borderRadius: borderRadius.md,
            padding: 20,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#FECACA',
            marginBottom: 16,
          }}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>😕</Text>
            <Text style={{ fontSize: 14, color: '#DC2626', fontWeight: '600', textAlign: 'center' }}>
              {error}
            </Text>
            <TouchableOpacity
              onPress={() => fetchLeaderboard()}
              style={{
                marginTop: 12,
                backgroundColor: colors.primary,
                borderRadius: borderRadius.sm,
                paddingHorizontal: 20,
                paddingVertical: 8,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Loading Skeletons */}
        {loading && (
          <View>
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonRow key={i} index={i} />
            ))}
          </View>
        )}

        {/* Empty State */}
        {!loading && !error && leaderboardData.length === 0 && (
          <View style={{
            ...glassmorphism.medium,
            padding: 40,
            alignItems: 'center',
          }}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>📊</Text>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 }}>
              No Data Yet
            </Text>
            <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center' }}>
              Start completing courses and engaging in forums to appear on the leaderboard!
            </Text>
          </View>
        )}

        {/* Leaderboard Rows */}
        {!loading && !error && leaderboardData.length > 0 && (
          <View>
            {leaderboardData.map((entry, index) => (
              <LeaderboardRow
                key={entry.userId?.toString() ?? index.toString()}
                entry={entry}
                index={index}
                isCurrentUser={
                  currentUserId != null &&
                  entry.userId?.toString() === currentUserId?.toString()
                }
              />
            ))}
          </View>
        )}

        {/* How to Climb Card */}
        {!loading && (
          <View style={{
            backgroundColor: colors.primary + '12',
            borderRadius: borderRadius.lg,
            padding: responsivePadding,
            marginTop: 20,
            borderWidth: 1,
            borderColor: colors.primary + '30',
          }}>
            <Text style={{
              fontSize: responsive.getFontSize(15, width),
              fontWeight: '700',
              color: colors.primary,
              marginBottom: 12,
            }}>
              💡 How to climb the leaderboard
            </Text>
            <View style={{ gap: 10 }}>
              {[
                { icon: '📚', text: 'Complete courses to earn XP & rank in Courses' },
                { icon: '💬', text: 'Post in forums to rank in the Forums category' },
                { icon: '📝', text: 'Pass quizzes to rank in the Quizzes category' },
                { icon: '⏱️', text: 'Log study time to dominate Study Time rankings' },
                { icon: '🔥', text: 'Maintain daily streaks to earn bonus XP' },
              ].map((tip, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                  <Text style={{ fontSize: 16, marginTop: 1 }}>{tip.icon}</Text>
                  <Text style={{
                    fontSize: responsive.getFontSize(13, width),
                    color: colors.textSecondary,
                    flex: 1,
                    lineHeight: 20,
                  }}>
                    {tip.text}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}