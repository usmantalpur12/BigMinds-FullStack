const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

// Import models
const User = require("../models/User");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const Quiz = require("../models/Quiz");
const Question = require("../models/Question");
const CourseThread = require("../models/CourseThread");
const CoursePost = require("../models/CoursePost");
const Forum = require("../models/Forum");
const ForumMember = require("../models/ForumMember");
const UserProgress = require("../models/UserProgress");

// Sample data
const sampleUsers = [
  {
    firstName: "Admin",
    lastName: "User",
    email: "admin@bigminds.com",
    password: "admin123",
    role: "admin",
    city: "Karachi",
    isEmailVerified: true,
    isActive: true,
  },
  {
    firstName: "Dr. Sarah",
    lastName: "Ahmed",
    email: "sarah.ahmed@bigminds.com",
    password: "teacher123",
    role: "teacher",
    city: "Lahore",
    educationLevel: "master",
    institution: "University of Lahore",
    isEmailVerified: true,
    isActive: true,
  },
  {
    firstName: "Ahmed",
    lastName: "Khan",
    email: "ahmed.khan@bigminds.com",
    password: "student123",
    role: "student",
    city: "Islamabad",
    educationLevel: "intermediate",
    targetExam: "mdcat",
    institution: "Govt College",
    isEmailVerified: true,
    isActive: true,
  },
  {
    firstName: "Fatima",
    lastName: "Zahra",
    email: "fatima.zahra@bigminds.com",
    password: "student123",
    role: "student",
    city: "Karachi",
    educationLevel: "intermediate",
    targetExam: "ecat",
    institution: "Beaconhouse",
    isEmailVerified: true,
    isActive: true,
  },
  {
    firstName: "Usman",
    lastName: "Ali",
    email: "usman.ali@bigminds.com",
    password: "student123",
    role: "student",
    city: "Peshawar",
    educationLevel: "bachelor",
    targetExam: "nts",
    institution: "University of Peshawar",
    isEmailVerified: true,
    isActive: true,
  },
];

const sampleCourses = [
  {
    title: "Physics Fundamentals - Class 11",
    description:
      "Comprehensive physics course covering all topics required for Class 11 Pre-Engineering students. Includes detailed explanations, practice questions, and mock tests.",
    shortDescription:
      "Master physics fundamentals for Class 11 Pre-Engineering",
    category: "pre-engineering",
    class: "11",
    level: "intermediate",
    price: 2999,
    instructorName: "Dr. Sarah Ahmed",
    thumbnail: "🔬",
    lessons: [
      {
        title: "Introduction to Physics",
        description: "Basic concepts and principles of physics",
        videoUrl: "https://example.com/physics-intro.mp4",
        duration: 45,
        order: 1,
        isFree: true,
      },
      {
        title: "Mechanics and Motion",
        description: "Understanding motion, forces, and energy",
        videoUrl: "https://example.com/mechanics.mp4",
        duration: 60,
        order: 2,
        isFree: false,
      },
      {
        title: "Waves and Oscillations",
        description: "Wave properties and oscillatory motion",
        videoUrl: "https://example.com/waves.mp4",
        duration: 55,
        order: 3,
        isFree: false,
      },
    ],
    isPublished: true,
    tags: ["physics", "pre-engineering", "class-11", "mechanics", "waves"],
  },
  {
    title: "Chemistry Essentials - Class 12",
    description:
      "Complete chemistry course for Class 12 Pre-Medical students. Covers organic, inorganic, and physical chemistry with practical applications.",
    shortDescription: "Complete chemistry for Class 12 Pre-Medical",
    category: "pre-medical",
    class: "12",
    level: "advanced",
    price: 3499,
    instructorName: "Dr. Sarah Ahmed",
    thumbnail: "🧪",
    lessons: [
      {
        title: "Organic Chemistry Basics",
        description: "Introduction to organic compounds and reactions",
        videoUrl: "https://example.com/organic-basics.mp4",
        duration: 50,
        order: 1,
        isFree: true,
      },
      {
        title: "Chemical Bonding",
        description: "Understanding molecular structure and bonding",
        videoUrl: "https://example.com/chemical-bonding.mp4",
        duration: 65,
        order: 2,
        isFree: false,
      },
    ],
    isPublished: true,
    tags: ["chemistry", "pre-medical", "class-12", "organic", "inorganic"],
  },
  {
    title: "Programming Fundamentals - Class 10",
    description:
      "Learn programming basics with Python. Perfect for Class 10 Computer Science students starting their coding journey.",
    shortDescription: "Learn Python programming basics for Class 10",
    category: "computer-science",
    class: "10",
    level: "beginner",
    price: 1999,
    instructorName: "Prof. Usman Ali",
    thumbnail: "🐍",
    lessons: [
      {
        title: "Introduction to Python",
        description: "Setting up Python and writing your first program",
        videoUrl: "https://example.com/python-intro.mp4",
        duration: 40,
        order: 1,
        isFree: true,
      },
      {
        title: "Variables and Data Types",
        description: "Understanding variables, strings, numbers, and booleans",
        videoUrl: "https://example.com/variables.mp4",
        duration: 45,
        order: 2,
        isFree: false,
      },
    ],
    isPublished: true,
    tags: ["programming", "python", "computer-science", "class-10", "coding"],
  },
  {
    title: "Business Mathematics - Class 11",
    description:
      "Essential mathematics for business students. Covers financial calculations, statistics, and business applications.",
    shortDescription: "Business math essentials for Class 11 BBA students",
    category: "bba",
    class: "11",
    level: "intermediate",
    price: 2499,
    instructorName: "Prof. Fatima Zahra",
    thumbnail: "📊",
    lessons: [
      {
        title: "Financial Mathematics",
        description: "Interest, loans, and investment calculations",
        videoUrl: "https://example.com/financial-math.mp4",
        duration: 55,
        order: 1,
        isFree: true,
      },
      {
        title: "Statistical Analysis",
        description: "Basic statistics for business decision making",
        videoUrl: "https://example.com/statistics.mp4",
        duration: 50,
        order: 2,
        isFree: false,
      },
    ],
    isPublished: true,
    tags: [
      "mathematics",
      "business",
      "bba",
      "class-11",
      "finance",
      "statistics",
    ],
  },
  {
    title: "O Level Mathematics",
    description:
      "Complete O Level mathematics preparation course. Covers all topics required for O Level examination.",
    shortDescription: "Complete O Level mathematics preparation",
    category: "o-levels",
    class: "o-level",
    level: "intermediate",
    price: 3999,
    instructorName: "Dr. Sarah Ahmed",
    thumbnail: "📐",
    lessons: [
      {
        title: "Number Systems",
        description: "Understanding different number systems and operations",
        videoUrl: "https://example.com/number-systems.mp4",
        duration: 45,
        order: 1,
        isFree: true,
      },
      {
        title: "Algebra and Equations",
        description: "Solving linear and quadratic equations",
        videoUrl: "https://example.com/algebra.mp4",
        duration: 60,
        order: 2,
        isFree: false,
      },
    ],
    isPublished: true,
    tags: ["mathematics", "o-level", "algebra", "geometry", "trigonometry"],
  },
  {
    title: "A Level Physics",
    description:
      "Advanced physics course for A Level students. Deep dive into complex physics concepts and applications.",
    shortDescription: "Advanced physics for A Level students",
    category: "a-levels",
    class: "a-level",
    level: "advanced",
    price: 4499,
    instructorName: "Prof. Usman Ali",
    thumbnail: "⚛️",
    lessons: [
      {
        title: "Quantum Mechanics",
        description: "Introduction to quantum physics principles",
        videoUrl: "https://example.com/quantum.mp4",
        duration: 70,
        order: 1,
        isFree: true,
      },
      {
        title: "Thermodynamics",
        description: "Advanced concepts in heat and energy",
        videoUrl: "https://example.com/thermodynamics.mp4",
        duration: 65,
        order: 2,
        isFree: false,
      },
    ],
    isPublished: true,
    tags: ["physics", "a-level", "quantum", "thermodynamics", "advanced"],
  },
];

const sampleQuizzes = [
  {
    title: "Biology Quiz 1: Cell Biology",
    description: "Test your knowledge of cell biology concepts",
    duration: 1800, // 30 minutes
    totalQuestions: 20,
    passingScore: 70,
    maxAttempts: 3,
    instructions:
      "Answer all questions within the time limit. Each question carries equal marks.",
    tags: ["biology", "cell-biology", "quiz"],
  },
  {
    title: "Mathematics Quiz: Algebra",
    description: "Practice algebra problems for ECAT preparation",
    duration: 1200, // 20 minutes
    totalQuestions: 15,
    passingScore: 75,
    maxAttempts: 2,
    instructions:
      "Show your work for partial credit. Calculators are not allowed.",
    tags: ["mathematics", "algebra", "quiz"],
  },
];

const sampleQuestions = [
  // Biology questions
  {
    stem: "Which of the following is NOT a function of the cell membrane?",
    type: "multiple-choice",
    options: [
      { text: "Protection of cell contents", isCorrect: false },
      {
        text: "Control of substances entering and leaving the cell",
        isCorrect: false,
      },
      { text: "Energy production through photosynthesis", isCorrect: true },
      { text: "Recognition of chemical signals", isCorrect: false },
    ],
    correctIndex: 2, // Index of the correct answer (0-based)
    explanation:
      "Energy production through photosynthesis occurs in chloroplasts, not in the cell membrane. The cell membrane's main functions are protection, selective permeability, and signal recognition.",
    difficulty: "medium",
    points: 2,
    tags: ["cell-biology", "membrane"],
  },
  {
    stem: "What is the powerhouse of the cell?",
    type: "multiple-choice",
    options: [
      { text: "Nucleus", isCorrect: false },
      { text: "Mitochondria", isCorrect: true },
      { text: "Endoplasmic reticulum", isCorrect: false },
      { text: "Golgi apparatus", isCorrect: false },
    ],
    correctIndex: 1, // Index of the correct answer (0-based)
    explanation:
      "Mitochondria are called the powerhouse of the cell because they produce energy through cellular respiration in the form of ATP.",
    difficulty: "easy",
    points: 1,
    tags: ["cell-biology", "mitochondria"],
  },
  // Mathematics questions
  {
    stem: "Solve for x: 2x + 5 = 13",
    type: "multiple-choice",
    options: [
      { text: "x = 3", isCorrect: false },
      { text: "x = 4", isCorrect: true },
      { text: "x = 5", isCorrect: false },
      { text: "x = 6", isCorrect: false },
    ],
    correctIndex: 1, // Index of the correct answer (0-based)
    explanation: "2x + 5 = 13 → 2x = 13 - 5 → 2x = 8 → x = 4",
    difficulty: "easy",
    points: 1,
    tags: ["algebra", "linear-equations"],
  },
  {
    stem: "What is the value of x² + 2x + 1 when x = 3?",
    type: "multiple-choice",
    options: [
      { text: "16", isCorrect: true },
      { text: "15", isCorrect: false },
      { text: "14", isCorrect: false },
      { text: "13", isCorrect: false },
    ],
    correctIndex: 0, // Index of the correct answer (0-based)
    explanation: "Substitute x = 3: 3² + 2(3) + 1 = 9 + 6 + 1 = 16",
    difficulty: "medium",
    points: 2,
    tags: ["algebra", "quadratic-expressions"],
  },
];

const sampleForums = [
  {
    title: "MDCAT Discussion Forum",
    description:
      "A place for MDCAT aspirants to discuss study strategies, share resources, and ask questions about the exam.",
    isPublic: true,
    category: "academic",
    tags: ["mdcat", "medical", "study", "discussion"],
    rules: [
      {
        title: "Be Respectful",
        description: "Treat all members with respect and kindness",
        order: 1,
      },
      {
        title: "Stay On Topic",
        description: "Keep discussions related to MDCAT preparation",
        order: 2,
      },
      {
        title: "No Spam",
        description: "Avoid posting irrelevant content or advertisements",
        order: 3,
      },
    ],
    allowAnonymous: false,
    allowAttachments: true,
    maxAttachmentSize: 5,
    allowedFileTypes: ["jpg", "png", "pdf", "doc", "docx"],
    moderationLevel: "basic",
  },
  {
    title: "Engineering Students Hub",
    description:
      "Forum for engineering students to discuss courses, projects, and career opportunities.",
    isPublic: true,
    category: "academic",
    tags: ["engineering", "ecat", "students", "career"],
    rules: [
      {
        title: "Academic Focus",
        description: "Focus on academic and career-related discussions",
        order: 1,
      },
      {
        title: "Share Knowledge",
        description: "Share your knowledge and help others",
        order: 2,
      },
    ],
    allowAnonymous: false,
    allowAttachments: true,
    maxAttachmentSize: 10,
    allowedFileTypes: ["jpg", "png", "pdf", "doc", "docx", "zip", "rar"],
    moderationLevel: "basic",
  },
];

const sampleAchievements = [
  {
    name: "First Steps",
    description: "Complete your first course",
    icon: "🎯",
    category: "course",
    xpReward: 50,
    rarity: "common",
    requirements: { coursesCompleted: 1 },
  },
  {
    name: "Quiz Master",
    description: "Score 100% on any quiz",
    icon: "🏆",
    category: "quiz",
    xpReward: 100,
    rarity: "rare",
    requirements: { perfectQuizScore: 1 },
  },
  {
    name: "Discussion Leader",
    description: "Create 10 discussion threads",
    icon: "💬",
    category: "forum",
    xpReward: 75,
    rarity: "rare",
    requirements: { threadsCreated: 10 },
  },
  {
    name: "Streak Hero",
    description: "Maintain a 7-day study streak",
    icon: "🔥",
    category: "streak",
    xpReward: 150,
    rarity: "rare",
    requirements: { streakDays: 7 },
  },
];

const sampleQuests = [
  {
    title: "Daily Study",
    description: "Study for at least 30 minutes today",
    type: "daily",
    category: "general",
    requirements: { studyTime: 30 },
    rewards: { xp: 25 },
    difficulty: "easy",
    isActive: true,
  },
  {
    title: "Quiz Champion",
    description: "Complete 3 quizzes this week",
    type: "weekly",
    category: "quiz",
    requirements: { quizzesCompleted: 3 },
    rewards: { xp: 100 },
    difficulty: "medium",
    isActive: true,
  },
  {
    title: "Social Butterfly",
    description: "Participate in 5 forum discussions",
    type: "weekly",
    category: "forum",
    requirements: { forumPosts: 5 },
    rewards: { xp: 75 },
    difficulty: "medium",
    isActive: true,
  },
];

// Main seeding function
async function seedDatabase() {
  try {
    console.log("🌱 Starting database seeding...");

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Clear existing data
    console.log("🧹 Clearing existing data...");
    await Promise.all([
      User.deleteMany({}),
      Course.deleteMany({}),
      Enrollment.deleteMany({}),
      Quiz.deleteMany({}),
      Question.deleteMany({}),
      CourseThread.deleteMany({}),
      CoursePost.deleteMany({}),
      Forum.deleteMany({}),
      ForumMember.deleteMany({}),
      UserProgress.deleteMany({}),
    ]);
    console.log("✅ Existing data cleared");

    // Create users
    console.log("👥 Creating users...");
    const createdUsers = [];
    for (const userData of sampleUsers) {
      const user = await User.create({
        ...userData,
        password: userData.password, // Let the User model hash it
      });
      createdUsers.push(user);
      console.log(`✅ Created user: ${user.firstName} ${user.lastName}`);
    }

    // Create courses
    console.log("📚 Creating courses...");
    const createdCourses = [];
    for (const courseData of sampleCourses) {
      const course = await Course.create({
        ...courseData,
        instructor: createdUsers.find((u) => u.role === "teacher")._id,
      });
      createdCourses.push(course);
      console.log(`✅ Created course: ${course.title}`);
    }

    // Create quizzes
    console.log("🧪 Creating quizzes...");
    const createdQuizzes = [];
    for (let i = 0; i < sampleQuizzes.length; i++) {
      const quizData = sampleQuizzes[i];
      // Ensure quizzes have a creator: prefer a teacher, fall back to admin
      const teacherUser = createdUsers.find((u) => u.role === "teacher");
      const fallbackUser =
        createdUsers.find((u) => u.role === "admin") || createdUsers[0];
      const creatorId =
        (teacherUser && teacherUser._id) || (fallbackUser && fallbackUser._id);

      const quiz = await Quiz.create({
        ...quizData,
        courseId: createdCourses[i]._id,
        createdBy: creatorId,
      });
      createdQuizzes.push(quiz);
      console.log(`✅ Created quiz: ${quiz.title}`);
    }

    // Create questions
    console.log("❓ Creating questions...");
    const createdQuestions = [];
    for (let i = 0; i < sampleQuestions.length; i++) {
      const questionData = sampleQuestions[i];
      const quizIndex = Math.floor(i / 2); // 2 questions per quiz
      const question = await Question.create({
        ...questionData,
        quizId: createdQuizzes[quizIndex]._id,
        order: (i % 2) + 1,
      });
      createdQuestions.push(question);
      console.log(`✅ Created question: ${question.stem.substring(0, 50)}...`);
    }

    // Create forums
    console.log("💬 Creating forums...");
    const createdForums = [];
    for (const forumData of sampleForums) {
      const forum = await Forum.create({
        ...forumData,
        createdById: createdUsers.find((u) => u.role === "admin")._id,
      });
      createdForums.push(forum);
      console.log(`✅ Created forum: ${forum.title}`);
    }

    // Create enrollments for students
    console.log("📝 Creating enrollments...");
    const students = createdUsers.filter((u) => u.role === "student");
    for (const student of students) {
      for (const course of createdCourses) {
        await Enrollment.create({
          courseId: course._id,
          studentId: student._id,
          status: "active",
          progress: Math.floor(Math.random() * 100),
          totalStudyTime: Math.floor(Math.random() * 300) + 60, // 1-6 hours
          lessonsCompleted: Math.floor(Math.random() * course.lessons.length),
          quizzesTaken: Math.floor(Math.random() * 3),
          averageQuizScore: Math.floor(Math.random() * 40) + 60, // 60-100%
        });
      }
      console.log(
        `✅ Created enrollments for: ${student.firstName} ${student.lastName}`,
      );
    }

    // Create forum memberships
    console.log("👥 Creating forum memberships...");
    for (const forum of createdForums) {
      // Admin is automatically a member
      await ForumMember.create({
        forumId: forum._id,
        userId: createdUsers.find((u) => u.role === "admin")._id,
        role: "admin",
        status: "approved",
        approvedAt: new Date(),
        approvedBy: createdUsers.find((u) => u.role === "admin")._id,
      });

      // Add students as members
      for (const student of students) {
        await ForumMember.create({
          forumId: forum._id,
          userId: student._id,
          role: "member",
          status: "approved",
          approvedAt: new Date(),
          approvedBy: createdUsers.find((u) => u.role === "admin")._id,
        });
      }
      console.log(`✅ Created memberships for forum: ${forum.title}`);
    }

    // Create user progress for gamification
    console.log("📊 Creating user progress...");
    for (const student of students) {
      await UserProgress.create({
        user: student._id,
        xp: Math.floor(Math.random() * 1000) + 100,
        level: Math.floor(Math.random() * 10) + 1,
        currentStreak: Math.floor(Math.random() * 7) + 1,
        longestStreak: Math.floor(Math.random() * 14) + 7,
        totalStudyTime: Math.floor(Math.random() * 1000) + 200,
        totalQuizzesTaken: Math.floor(Math.random() * 10) + 1,
        averageQuizScore: Math.floor(Math.random() * 30) + 70,
        totalPosts: Math.floor(Math.random() * 20) + 1,
        totalThreads: Math.floor(Math.random() * 5) + 1,
        achievements: [],
        activeQuests: [],
        completedQuests: [],
      });
      console.log(
        `✅ Created progress for: ${student.firstName} ${student.lastName}`,
      );
    }

    // Create sample course threads
    console.log("💭 Creating course threads...");
    for (const course of createdCourses) {
      const thread = await CourseThread.create({
        courseId: course._id,
        authorId: students[0]._id,
        title: `Welcome to ${course.title}!`,
        content: `Hello everyone! Welcome to this course. Feel free to ask questions and share your thoughts. Let's learn together!`,
        category: "general",
        tags: ["welcome", "introduction"],
      });
      console.log(`✅ Created thread: ${thread.title}`);

      // Create a reply
      await CoursePost.create({
        threadId: thread._id,
        authorId: students[1]._id,
        content:
          "Thanks for the welcome! I'm excited to start learning. Does anyone have any tips for studying this subject?",
      });
      console.log(`✅ Created post reply`);
    }

    console.log("🎉 Database seeding completed successfully!");
    console.log(`📊 Created ${createdUsers.length} users`);
    console.log(`📚 Created ${createdCourses.length} courses`);
    console.log(`🧪 Created ${createdQuizzes.length} quizzes`);
    console.log(`❓ Created ${createdQuestions.length} questions`);
    console.log(`💬 Created ${createdForums.length} forums`);
    console.log(`🏆 Created ${sampleAchievements.length} achievements`);
    console.log(`⚔️ Created ${sampleQuests.length} quests`);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

// Run seeder if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log("✅ Seeding completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Seeding failed:", error);
      process.exit(1);
    });
}

module.exports = seedDatabase;
