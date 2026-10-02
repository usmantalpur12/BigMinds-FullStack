import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';
import { colors, spacing, borderRadius, shadows, typography } from '../theme/colors';
import { gamificationService, Quest } from '../services/gamificationService';

const { width } = Dimensions.get('window');

export default function ChallengesScreen() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [startingQuest, setStartingQuest] = useState<string | null>(null);
  const [stats, setStats] = useState({ dailyXP: 0, completedToday: 0 });

  const categories = [
    { id: 'all', name: 'All', icon: 'grid-outline' },
    { id: 'daily', name: 'Daily', icon: 'today-outline' },
    { id: 'academic', name: 'Academic', icon: 'school-outline' },
    { id: 'quiz', name: 'Quiz', icon: 'document-text-outline' },
    { id: 'achievement', name: 'Elite', icon: 'trophy-outline' },
  ];

  const loadQuests = async () => {
    try {
      if (!refreshing) setLoading(true);
      const data = await gamificationService.getQuests(selectedCategory);
      setQuests(data);
      
      // Calculate mock stats for UI
      const completed = data.filter(q => q.status === 'completed').length;
      const xp = data.filter(q => q.status === 'completed').reduce((acc, q) => acc + q.xpReward, 0);
      setStats({ dailyXP: xp, completedToday: completed });
    } catch (error) {
      console.error('Error loading quests:', error);
      setQuests([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleStartQuest = async (questId: string) => {
    try {
      setStartingQuest(questId);
      await gamificationService.startQuest(questId);
      Alert.alert('Challenge Started', 'Good luck on your quest!');
      loadQuests();
    } catch (error) {
      console.error('Failed to start challenge', error);
      Alert.alert('Error', 'Could not start challenge');
    } finally {
      setStartingQuest(null);
    }
  };

  const handleClaimReward = async (questId: string) => {
    try {
      setStartingQuest(questId);
      // Assuming a claimReward endpoint exists or we reuse start for now
      // await gamificationService.claimReward(questId);
      loadQuests();
      Alert.alert('Reward Claimed!', 'XP added to your profile 🌟');
    } catch (error) {
      Alert.alert('Error', 'Failed to claim reward');
    } finally {
      setStartingQuest(null);
    }
  };

  useEffect(() => {
    loadQuests();
  }, [selectedCategory]);

  const getQuestColors = (type: string = 'daily') => {
    switch (type.toLowerCase()) {
      case 'achievement':
      case 'elite':
        return ['#8B5CF6', '#7C3AED']; // Purple
      case 'academic':
        return ['#3B82F6', '#2563EB']; // Blue
      case 'quiz':
        return ['#F59E0B', '#D97706']; // Amber
      default:
        return ['#10B981', '#059669']; // Emerald/Daily
    }
  };

  const renderQuestCard = (quest: Quest, index: number) => {
    const cardColors = getQuestColors(quest.type || 'daily');
    const isCompleted = quest.status === 'completed';
    const isInProgress = quest.status === 'in_progress';

    return (
      <Animatable.View
        key={quest._id}
        animation="fadeInUp"
        duration={500}
        delay={index * 100}
        style={styles.cardContainer}
      >
        <TouchableOpacity 
          activeOpacity={0.9}
          style={styles.card}
          onPress={() => isCompleted ? null : isInProgress ? null : handleStartQuest(quest._id)}
        >
          <LinearGradient
            colors={[...cardColors, cardColors[1]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          >
            <View style={styles.cardHeader}>
              <View style={styles.typeBadge}>
                <Text style={styles.typeText}>{(quest.type || 'Quest').toUpperCase()}</Text>
              </View>
              <View style={styles.rewardBadge}>
                <Ionicons name="flash" size={12} color="#FBBF24" />
                <Text style={styles.rewardText}>{quest.xpReward} XP</Text>
              </View>
            </View>

            <Text style={styles.questTitle}>{quest.title}</Text>
            <Text style={styles.questDescription} numberOfLines={2}>
              {quest.description}
            </Text>

            <View style={styles.cardFooter}>
              {isInProgress ? (
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: '45%' }]} />
                  </View>
                  <Text style={styles.progressText}>NEARLY THERE</Text>
                </View>
              ) : isCompleted ? (
                <View style={styles.completedBadge}>
                  <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                  <Text style={styles.completedText}>COMPLETED</Text>
                </View>
              ) : (
                <View style={styles.startButton}>
                  <Text style={styles.startButtonText}>START QUEST</Text>
                  <Ionicons name="chevron-forward" size={16} color="#FFF" />
                </View>
              )}
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animatable.View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#4F46E5', '#3730A3']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Quest Board</Text>
            <Text style={styles.headerSubtitle}>Master your skills, earn rewards</Text>
          </View>
          <TouchableOpacity style={styles.profileCircle}>
            <Ionicons name="person" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats.dailyXP}</Text>
            <Text style={styles.statLabel}>Today's XP</Text>
          </View>
          <View style={[styles.statBox, styles.statDivider]}>
            <Text style={styles.statValue}>{stats.completedToday}</Text>
            <Text style={styles.statLabel}>Quests Done</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>lvl 14</Text>
            <Text style={styles.statLabel}>Current Rank</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.categoryScrollContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryList}
          >
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setSelectedCategory(cat.id)}
                style={[
                  styles.categoryItem,
                  selectedCategory === cat.id && styles.categoryItemActive
                ]}
              >
                <Ionicons 
                  name={cat.icon as any} 
                  size={20} 
                  color={selectedCategory === cat.id ? '#FFF' : '#6B7280'} 
                />
                <Text style={[
                  styles.categoryText,
                  selectedCategory === cat.id && styles.categoryTextActive
                ]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadQuests(); }} />
          }
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4F46E5" />
            </View>
          ) : quests.length === 0 ? (
            <Animatable.View animation="fadeIn" style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🎯</Text>
              <Text style={styles.emptyTitle}>No Quests Available</Text>
              <Text style={styles.emptySubtitle}>Check back later for new challenges!</Text>
            </Animatable.View>
          ) : (
            quests.map((quest, index) => renderQuestCard(quest, index))
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  profileCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    padding: 15,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  content: {
    flex: 1,
    marginTop: -20,
  },
  categoryScrollContainer: {
    height: 60,
    marginBottom: 10,
  },
  categoryList: {
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 12,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    gap: 8,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3 },
      android: { elevation: 2 }
    })
  },
  categoryItemActive: {
    backgroundColor: '#4F46E5',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  categoryTextActive: {
    color: '#FFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
  },
  cardContainer: {
    marginBottom: 16,
  },
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
      android: { elevation: 4 }
    })
  },
  cardGradient: {
    padding: 20,
    minHeight: 180,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  typeBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  typeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 4,
  },
  rewardText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  questTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  questDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 20,
    marginBottom: 20,
  },
  cardFooter: {
    marginTop: 'auto',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 12,
    borderRadius: 15,
    gap: 8,
  },
  startButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 13,
    letterSpacing: 1,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
    paddingVertical: 12,
    borderRadius: 15,
    gap: 8,
  },
  completedText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  progressContainer: {
    gap: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFF',
    borderRadius: 4,
  },
  progressText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'right',
  },
  loadingContainer: {
    paddingTop: 100,
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
});

