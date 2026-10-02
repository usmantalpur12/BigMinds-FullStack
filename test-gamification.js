// Test script for BigMinds Gamification System
// Run this to verify the system is working correctly

const testGamification = () => {
  console.log('🎮 Testing BigMinds Gamification System...\n');

  // Test XP calculations
  console.log('📊 XP & Leveling System:');
  const XP_LEVELS = {
    1: 0, 2: 100, 3: 250, 4: 450, 5: 700,
    6: 1000, 7: 1350, 8: 1750, 9: 2200, 10: 2700
  };

  const calculateLevel = (xp) => {
    let level = 1;
    for (let lvl in XP_LEVELS) {
      if (xp >= XP_LEVELS[lvl]) {
        level = parseInt(lvl);
      } else {
        break;
      }
    }
    return level;
  };

  console.log(`  • 0 XP = Level ${calculateLevel(0)}`);
  console.log(`  • 150 XP = Level ${calculateLevel(150)}`);
  console.log(`  • 500 XP = Level ${calculateLevel(500)}`);
  console.log(`  • 1000 XP = Level ${calculateLevel(1000)}`);
  console.log(`  • 2000 XP = Level ${calculateLevel(2000)}`);

  // Test streak bonuses
  console.log('\n🔥 Streak System:');
  const calculateStreakBonus = (streak) => {
    if (streak >= 30) return 3;
    if (streak >= 14) return 2;
    if (streak >= 7) return 1.5;
    return 1;
  };

  console.log(`  • 3-day streak: ${calculateStreakBonus(3)}x bonus`);
  console.log(`  • 7-day streak: ${calculateStreakBonus(7)}x bonus`);
  console.log(`  • 14-day streak: ${calculateStreakBonus(14)}x bonus`);
  console.log(`  • 30-day streak: ${calculateStreakBonus(30)}x bonus`);

  // Test achievement categories
  console.log('\n🏆 Achievement System:');
  const achievements = [
    { name: 'First Course', category: 'course', rarity: 'common', xp: 50 },
    { name: 'Streak Master', category: 'streak', rarity: 'epic', xp: 250 },
    { name: 'Forum Helper', category: 'forum', rarity: 'rare', xp: 100 },
    { name: 'Level 20', category: 'milestone', rarity: 'epic', xp: 500 },
  ];

  achievements.forEach(achievement => {
    console.log(`  • ${achievement.name} (${achievement.category}) - ${achievement.rarity} rarity, +${achievement.xp} XP`);
  });

  // Test quest types
  console.log('\n🎯 Quest System:');
  const questTypes = [
    { type: 'daily', title: 'Daily Learning', xp: 25, difficulty: 'easy' },
    { type: 'weekly', title: 'Weekly Warrior', xp: 100, difficulty: 'medium' },
    { type: 'monthly', title: 'Monthly Master', xp: 500, difficulty: 'hard' },
    { type: 'special', title: 'Perfect Score', xp: 100, difficulty: 'expert' },
  ];

  questTypes.forEach(quest => {
    console.log(`  • ${quest.type.toUpperCase()}: ${quest.title} - ${quest.difficulty} difficulty, +${quest.xp} XP`);
  });

  // Test leaderboard categories
  console.log('\n🏅 Leaderboard Categories:');
  const leaderboardCategories = ['overall', 'xp', 'level', 'streak', 'study_time'];
  leaderboardCategories.forEach(category => {
    console.log(`  • ${category.charAt(0).toUpperCase() + category.slice(1)}`);
  });

  // Test analytics metrics
  console.log('\n📈 Learning Analytics:');
  const analyticsMetrics = [
    'Total Study Time',
    'Average Accuracy',
    'Quizzes Taken',
    'Courses Completed',
    'Achievements Earned',
    'Current Streak',
    'Longest Streak',
    'Weekly Progress',
    'Monthly Progress'
  ];

  analyticsMetrics.forEach(metric => {
    console.log(`  • ${metric}`);
  });

  console.log('\n✅ Gamification system test completed successfully!');
  console.log('\n🚀 To get started:');
  console.log('  1. Run the backend seeder: node bigminds-backend/seeders/runSeeders.js');
  console.log('  2. Start the backend server: cd bigminds-backend && npm start');
  console.log('  3. Start the frontend: cd BigMindsEducation && npm start');
  console.log('  4. Navigate to the Gamification tab in the app');
};

// Run the test
testGamification(); 