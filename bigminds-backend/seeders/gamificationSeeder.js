const Achievement = require('../models/Achievement');
const Quest = require('../models/Quest');

// Seed achievements
const achievements = [
  // Course achievements
  {
    name: 'First Steps',
    description: 'Complete your first course',
    icon: '🎯',
    category: 'course',
    requirements: { coursesCompleted: 1 },
    xpReward: 50,
    rarity: 'common',
  },
  {
    name: 'Course Master',
    description: 'Complete 5 courses',
    icon: '📚',
    category: 'course',
    requirements: { coursesCompleted: 5 },
    xpReward: 200,
    rarity: 'rare',
  },
  {
    name: 'Learning Champion',
    description: 'Complete 10 courses',
    icon: '🏆',
    category: 'course',
    requirements: { coursesCompleted: 10 },
    xpReward: 500,
    rarity: 'epic',
  },
  {
    name: 'Education Expert',
    description: 'Complete 20 courses',
    icon: '🎓',
    category: 'course',
    requirements: { coursesCompleted: 20 },
    xpReward: 1000,
    rarity: 'legendary',
  },

  // Streak achievements
  {
    name: 'Streak Starter',
    description: 'Maintain a 3-day streak',
    icon: '🔥',
    category: 'streak',
    requirements: { streak: 3 },
    xpReward: 30,
    rarity: 'common',
  },
  {
    name: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: '⚡',
    category: 'streak',
    requirements: { streak: 7 },
    xpReward: 100,
    rarity: 'rare',
  },
  {
    name: 'Streak Master',
    description: 'Maintain a 14-day streak',
    icon: '🌟',
    category: 'streak',
    requirements: { streak: 14 },
    xpReward: 250,
    rarity: 'epic',
  },
  {
    name: 'Streak Legend',
    description: 'Maintain a 30-day streak',
    icon: '👑',
    category: 'streak',
    requirements: { streak: 30 },
    xpReward: 750,
    rarity: 'legendary',
  },

  // Forum achievements
  {
    name: 'First Post',
    description: 'Make your first forum post',
    icon: '💬',
    category: 'forum',
    requirements: { forumPosts: 1 },
    xpReward: 25,
    rarity: 'common',
  },
  {
    name: 'Active Contributor',
    description: 'Make 10 forum posts',
    icon: '📝',
    category: 'forum',
    requirements: { forumPosts: 10 },
    xpReward: 100,
    rarity: 'rare',
  },
  {
    name: 'Forum Helper',
    description: 'Make 25 forum posts',
    icon: '🤝',
    category: 'forum',
    requirements: { forumPosts: 25 },
    xpReward: 250,
    rarity: 'epic',
  },
  {
    name: 'Community Leader',
    description: 'Make 50 forum posts',
    icon: '👨‍💼',
    category: 'forum',
    requirements: { forumPosts: 50 },
    xpReward: 500,
    rarity: 'legendary',
  },

  // Quiz achievements
  {
    name: 'Quiz Taker',
    description: 'Take your first quiz',
    icon: '❓',
    category: 'quiz',
    requirements: { quizzesTaken: 1 },
    xpReward: 25,
    rarity: 'common',
  },
  {
    name: 'Quiz Master',
    description: 'Take 10 quizzes',
    icon: '🧠',
    category: 'quiz',
    requirements: { quizzesTaken: 10 },
    xpReward: 100,
    rarity: 'rare',
  },
  {
    name: 'Perfect Score',
    description: 'Get 100% accuracy on a quiz',
    icon: '💯',
    category: 'quiz',
    requirements: { accuracy: 100 },
    xpReward: 150,
    rarity: 'epic',
  },

  // Milestone achievements
  {
    name: 'Level 5',
    description: 'Reach level 5',
    icon: '⭐',
    category: 'milestone',
    requirements: { level: 5 },
    xpReward: 100,
    rarity: 'common',
  },
  {
    name: 'Level 10',
    description: 'Reach level 10',
    icon: '⭐⭐',
    category: 'milestone',
    requirements: { level: 10 },
    xpReward: 250,
    rarity: 'rare',
  },
  {
    name: 'Level 20',
    description: 'Reach level 20',
    icon: '⭐⭐⭐',
    category: 'milestone',
    requirements: { level: 20 },
    xpReward: 500,
    rarity: 'epic',
  },
  {
    name: 'Level 50',
    description: 'Reach level 50',
    icon: '👑',
    category: 'milestone',
    requirements: { level: 50 },
    xpReward: 1000,
    rarity: 'legendary',
  },

  // Special achievements
  {
    name: 'Early Bird',
    description: 'Join the platform in the first month',
    icon: '🌅',
    category: 'special',
    requirements: { joinDate: '2024-01' },
    xpReward: 100,
    rarity: 'rare',
  },
  {
    name: 'Study Buddy',
    description: 'Help another student in the forum',
    icon: '🤝',
    category: 'special',
    requirements: { helpfulVotes: 5 },
    xpReward: 150,
    rarity: 'epic',
  },
];

// Seed quests
const quests = [
  // Daily quests
  {
    title: 'Daily Learning',
    description: 'Complete at least 30 minutes of study time today',
    type: 'daily',
    category: 'general',
    requirements: { target: 30, unit: 'minutes' },
    rewards: { xp: 25, points: 10 },
    difficulty: 'easy',
    icon: '📚',
    color: '#4F46E5',
  },
  {
    title: 'Quiz Champion',
    description: 'Take at least 2 quizzes today',
    type: 'daily',
    category: 'quiz',
    requirements: { target: 2, unit: 'quizzes' },
    rewards: { xp: 30, points: 15 },
    difficulty: 'easy',
    icon: '🧠',
    color: '#10B981',
  },
  {
    title: 'Forum Helper',
    description: 'Make at least 1 forum post today',
    type: 'daily',
    category: 'forum',
    requirements: { target: 1, unit: 'posts' },
    rewards: { xp: 20, points: 10 },
    difficulty: 'easy',
    icon: '💬',
    color: '#F59E0B',
  },

  // Weekly quests
  {
    title: 'Weekly Warrior',
    description: 'Maintain a 5-day streak this week',
    type: 'weekly',
    category: 'streak',
    requirements: { target: 5, unit: 'days' },
    rewards: { xp: 100, points: 50 },
    difficulty: 'medium',
    icon: '🔥',
    color: '#EF4444',
  },
  {
    title: 'Course Explorer',
    description: 'Complete at least 2 courses this week',
    type: 'weekly',
    category: 'course',
    requirements: { target: 2, unit: 'courses' },
    rewards: { xp: 150, points: 75 },
    difficulty: 'medium',
    icon: '🎯',
    color: '#8B5CF6',
  },
  {
    title: 'Knowledge Seeker',
    description: 'Study for at least 5 hours this week',
    type: 'weekly',
    category: 'general',
    requirements: { target: 300, unit: 'minutes' },
    rewards: { xp: 200, points: 100 },
    difficulty: 'medium',
    icon: '⏱️',
    color: '#06B6D4',
  },

  // Monthly quests
  {
    title: 'Monthly Master',
    description: 'Reach level 10 this month',
    type: 'monthly',
    category: 'milestone',
    requirements: { target: 10, unit: 'level' },
    rewards: { xp: 500, points: 250 },
    difficulty: 'hard',
    icon: '🏆',
    color: '#F59E0B',
  },
  {
    title: 'Social Butterfly',
    description: 'Make at least 20 forum posts this month',
    type: 'monthly',
    category: 'forum',
    requirements: { target: 20, unit: 'posts' },
    rewards: { xp: 300, points: 150 },
    difficulty: 'hard',
    icon: '🦋',
    color: '#EC4899',
  },
  {
    title: 'Study Marathon',
    description: 'Study for at least 25 hours this month',
    type: 'monthly',
    category: 'general',
    requirements: { target: 1500, unit: 'minutes' },
    rewards: { xp: 400, points: 200 },
    difficulty: 'hard',
    icon: '🏃‍♂️',
    color: '#10B981',
  },

  // Special quests
  {
    title: 'Perfect Score',
    description: 'Get 100% accuracy on any quiz',
    type: 'special',
    category: 'quiz',
    requirements: { target: 100, unit: 'accuracy' },
    rewards: { xp: 100, points: 50 },
    difficulty: 'expert',
    icon: '💯',
    color: '#EF4444',
  },
  {
    title: 'Streak Hero',
    description: 'Maintain a 7-day streak',
    type: 'special',
    category: 'streak',
    requirements: { target: 7, unit: 'days' },
    rewards: { xp: 200, points: 100 },
    difficulty: 'expert',
    icon: '🔥',
    color: '#F59E0B',
  },
];

// Seed function
const seedGamification = async () => {
  try {
    console.log('🌱 Seeding gamification data...');

    // Clear existing data
    await Achievement.deleteMany({});
    await Quest.deleteMany({});

    // Insert achievements
    const createdAchievements = await Achievement.insertMany(achievements);
    console.log(`✅ Created ${createdAchievements.length} achievements`);

    // Insert quests
    const createdQuests = await Quest.insertMany(quests);
    console.log(`✅ Created ${createdQuests.length} quests`);

    console.log('🎉 Gamification seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding gamification data:', error);
    throw error;
  }
};

module.exports = { seedGamification }; 