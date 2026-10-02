const mongoose = require("mongoose");
require("dotenv").config();

const Achievement = require("../models/Achievement");
const Quest = require("../models/Quest");
const UserAchievement = require("../models/UserAchievement");
const UserQuest = require("../models/UserQuest");
const StudyGroup = require("../models/StudyGroup");
const StudySession = require("../models/StudySession");
const UserDocument = require("../models/UserDocument");
const AssignmentSubmission = require("../models/AssignmentSubmission");
const ResourceShare = require("../models/ResourceShare");
const ExpertQnA = require("../models/ExpertQnA");
const StudyReminder = require("../models/StudyReminder");
const Payment = require("../models/Payment");
const Category = require("../models/Category");
const Gamification = require("../models/Gamification");
const Resource = require("../models/Resource");
const Reminder = require("../models/Reminder");
const StudyPartner = require("../models/StudyPartner");
const CollaborativeNote = require("../models/CollaborativeNote");

const sampleUserIds = [
  new mongoose.Types.ObjectId(),
  new mongoose.Types.ObjectId(),
  new mongoose.Types.ObjectId(),
];

const sampleForumIds = [
  new mongoose.Types.ObjectId(),
  new mongoose.Types.ObjectId(),
];

const sampleCourseIds = [
  new mongoose.Types.ObjectId(),
  new mongoose.Types.ObjectId(),
];

const sampleAssignmentIds = [
  new mongoose.Types.ObjectId(),
  new mongoose.Types.ObjectId(),
];

const sampleQuestIds = [
  new mongoose.Types.ObjectId(),
  new mongoose.Types.ObjectId(),
  new mongoose.Types.ObjectId(),
];

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB for seeding");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

const seedCollections = async () => {
  const categories = [
    {
      name: "Pre-Engineering",
      slug: "pre-engineering",
      icon: "🔧",
      description: "Engineering preparation courses for FSc students.",
      classes: [
        {
          id: "9",
          name: "Class 9",
          description: "Introduction to foundational concepts",
        },
        {
          id: "10",
          name: "Class 10",
          description: "Core mathematics and physics review",
        },
      ],
    },
    {
      name: "Pre-Medical",
      slug: "pre-medical",
      icon: "🏥",
      description: "Medical preparation courses for FSc students.",
      classes: [
        {
          id: "9",
          name: "Class 9",
          description: "Medical foundations and biology",
        },
        {
          id: "10",
          name: "Class 10",
          description: "Chemistry and biology skill building",
        },
      ],
    },
    {
      name: "Computer Science",
      slug: "computer-science",
      icon: "💻",
      description: "Computer science and programming courses.",
      classes: [
        {
          id: "9",
          name: "Class 9",
          description: "Introductory programming and logic",
        },
        {
          id: "10",
          name: "Class 10",
          description: "Algorithms and computational thinking",
        },
      ],
    },
  ];

  const gamifications = [
    {
      name: "XP System",
      type: "system",
      description: "Defines how XP is earned across the platform.",
      icon: "⚡",
      color: "#10B981",
      settings: { baseXP: 10, bonusXP: 25 },
      isActive: true,
    },
    {
      name: "Badge Rewards",
      type: "badge",
      description: "Configures badge levels for learning achievements.",
      icon: "🏅",
      color: "#F59E0B",
      settings: { beginner: 10, intermediate: 50, expert: 150 },
      isActive: true,
    },
  ];

  const resources = [
    {
      title: "Study Blueprint for Class 10",
      description: "Downloadable plan for exam preparation.",
      url: "https://example.com/resources/study-blueprint.pdf",
      type: "document",
      owner: sampleUserIds[0],
      category: "study-plans",
      tags: ["study", "plan", "exam"],
    },
    {
      title: "Physics Concept Video",
      description: "Short video covering motion and forces.",
      url: "https://example.com/resources/physics-motion.mp4",
      type: "video",
      owner: sampleUserIds[1],
      category: "physics",
      tags: ["physics", "video", "motion"],
    },
  ];

  const reminders = [
    {
      userId: sampleUserIds[0],
      title: "Finish Chapter 5 review",
      description: "Review the key exercises and notes before the weekend.",
      remindAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      priority: "high",
      notificationType: "push",
      category: "revision",
    },
    {
      userId: sampleUserIds[1],
      title: "Practice math quiz",
      description: "Complete the weekly practice quiz on algebra.",
      remindAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      priority: "medium",
      notificationType: "email",
      category: "quiz",
    },
  ];

  const studyPartners = [
    {
      userId: sampleUserIds[0],
      partnerId: sampleUserIds[1],
      subject: "Physics",
      goals: ["Cover motion problems", "Build joint review notes"],
      preferredStudyTime: "Evenings",
      status: "active",
    },
    {
      userId: sampleUserIds[1],
      partnerId: sampleUserIds[2],
      subject: "Biology",
      goals: ["Review human anatomy", "Do flashcards"],
      preferredStudyTime: "Afternoons",
      status: "pending",
    },
  ];

  const achievements = [
    {
      name: "Quick Starter",
      description: "Complete your first lesson.",
      icon: "🚀",
      category: "course",
      requirements: { coursesCompleted: 1 },
      xpReward: 30,
      rarity: "common",
      isActive: true,
    },
    {
      name: "Community Helper",
      description: "Answer a question in the forum.",
      icon: "🤝",
      category: "forum",
      requirements: { forumPosts: 1 },
      xpReward: 20,
      rarity: "common",
      isActive: true,
    },
  ];

  const quests = [
    {
      _id: sampleQuestIds[0],
      title: "Complete 3 lessons",
      description: "Finish three lessons to earn a reward.",
      type: "daily",
      category: "course",
      requirements: { target: 3, unit: "lessons" },
      rewards: { xp: 50, points: 20 },
      difficulty: "easy",
      icon: "📘",
      color: "#2563EB",
      isActive: true,
    },
    {
      _id: sampleQuestIds[1],
      title: "Join a study session",
      description: "Participate in one collaborative session.",
      type: "weekly",
      category: "study",
      requirements: { target: 1, unit: "session" },
      rewards: { xp: 80, points: 35 },
      difficulty: "medium",
      icon: "👥",
      color: "#8B5CF6",
      isActive: true,
    },
    {
      _id: sampleQuestIds[2],
      title: "Share a resource",
      description: "Upload a helpful study resource.",
      type: "daily",
      category: "resource",
      requirements: { target: 1, unit: "resource" },
      rewards: { xp: 40, points: 15 },
      difficulty: "easy",
      icon: "📎",
      color: "#F59E0B",
      isActive: true,
    },
  ];

  const userAchievements = [
    {
      userId: sampleUserIds[0],
      achievementId: null,
      isCompleted: true,
      earnedAt: new Date(),
    },
    {
      userId: sampleUserIds[1],
      achievementId: null,
      isCompleted: false,
    },
  ];

  const userQuests = [
    {
      userId: sampleUserIds[0],
      questId: sampleQuestIds[0],
      status: "in_progress",
      progress: { lessons: 1 },
      startedAt: new Date(Date.now() - 1000 * 60 * 60),
    },
    {
      userId: sampleUserIds[1],
      questId: sampleQuestIds[1],
      status: "not_started",
    },
  ];

  const studyGroups = [
    {
      name: "Physics Practice Team",
      subject: "Physics",
      maxMembers: 8,
      meetingTime: "7:00 PM",
      meetingDay: "Wednesday",
      createdBy: sampleUserIds[0],
      forumId: sampleForumIds[0],
      description: "Weekly problem-solving group for physics revision.",
      topics: ["motion", "forces", "energy"],
    },
    {
      name: "Biology Revision Circle",
      subject: "Biology",
      maxMembers: 6,
      meetingTime: "5:30 PM",
      meetingDay: "Tuesday",
      createdBy: sampleUserIds[1],
      forumId: sampleForumIds[1],
      description: "Review biology concepts and past paper questions.",
      topics: ["cells", "human body", "ecosystems"],
    },
  ];

  const studySessions = [
    {
      forumId: sampleForumIds[0],
      title: "Exam Prep Sprint",
      description: "Focused study sprint with timed practice questions.",
      startTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
      duration: 90,
      maxParticipants: 20,
      createdBy: sampleUserIds[0],
      topics: ["review", "practice"],
      meetingLink: "https://example.com/session/1",
    },
    {
      forumId: sampleForumIds[1],
      title: "Concept Review Lab",
      description: "Live group session on difficult topics.",
      startTime: new Date(Date.now() + 4 * 60 * 60 * 1000),
      duration: 60,
      maxParticipants: 15,
      createdBy: sampleUserIds[1],
      topics: ["anatomy", "diagrams"],
      meetingLink: "https://example.com/session/2",
    },
  ];

  const userDocuments = [
    {
      userId: sampleUserIds[0],
      type: "degree",
      title: "High School Transcript",
      fileUrl: "https://example.com/documents/transcript.pdf",
      fileName: "transcript.pdf",
      fileSize: 120_000,
      mimeType: "application/pdf",
      verified: true,
    },
    {
      userId: sampleUserIds[1],
      type: "identity",
      title: "Student ID Card",
      fileUrl: "https://example.com/documents/id-card.pdf",
      fileName: "id-card.pdf",
      fileSize: 80_000,
      mimeType: "application/pdf",
      verified: false,
    },
  ];

  const assignmentSubmissions = [
    {
      assignmentId: sampleAssignmentIds[0],
      courseId: sampleCourseIds[0],
      studentId: sampleUserIds[0],
      submissionText: "Completed the assignment with full solutions.",
      attachments: [
        {
          title: "Solution PDF",
          type: "pdf",
          url: "https://example.com/assignments/assignment1.pdf",
        },
      ],
      isLate: false,
      score: 92,
      maxScore: 100,
      feedback: "Great work!",
    },
    {
      assignmentId: sampleAssignmentIds[1],
      courseId: sampleCourseIds[1],
      studentId: sampleUserIds[1],
      submissionText: "Submitted the assignment draft for review.",
      attachments: [
        {
          title: "Draft File",
          type: "docx",
          url: "https://example.com/assignments/draft2.docx",
        },
      ],
      isLate: false,
      score: 85,
      maxScore: 100,
      feedback: "Solid effort, refine a few points.",
    },
  ];

  const resourceShares = [
    {
      title: "Algebra Practice Set",
      description: "A curated set of algebra problems with solutions.",
      type: "document",
      url: "https://example.com/resources/algebra-practice.pdf",
      uploadedBy: sampleUserIds[0],
      forumId: sampleForumIds[0],
      tags: ["algebra", "practice", "math"],
      category: "mathematics",
      difficulty: "beginner",
      language: "English",
    },
    {
      title: "Organic Chemistry Summary",
      description: "Quick reference notes for organic chemistry.",
      type: "document",
      url: "https://example.com/resources/organic-summary.pdf",
      uploadedBy: sampleUserIds[1],
      forumId: sampleForumIds[1],
      tags: ["chemistry", "organic", "notes"],
      category: "chemistry",
      difficulty: "intermediate",
      language: "English",
    },
  ];

  const expertQnAs = [
    {
      question: "What is the easiest way to memorize formulas?",
      answer: "Use flashcards and spaced repetition.",
      askedBy: sampleUserIds[0],
      answeredBy: sampleUserIds[1],
      forumId: sampleForumIds[0],
      subject: "Mathematics",
      tags: ["formulas", "memory"],
      priority: "medium",
      status: "answered",
    },
    {
      question: "How do I prepare for a biology practical exam?",
      answer: "Practice experiments and review lab notes regularly.",
      askedBy: sampleUserIds[1],
      answeredBy: sampleUserIds[2],
      forumId: sampleForumIds[1],
      subject: "Biology",
      tags: ["practical", "exam"],
      priority: "high",
      status: "answered",
    },
  ];

  const studyReminders = [
    {
      userId: sampleUserIds[0],
      forumId: sampleForumIds[0],
      title: "Start physics chapter review",
      description: "Read through the next chapter and solve example questions.",
      reminderTime: new Date(Date.now() + 12 * 60 * 60 * 1000),
      isRecurring: false,
      notificationType: "push",
      priority: "high",
    },
    {
      userId: sampleUserIds[1],
      forumId: sampleForumIds[1],
      title: "Prepare chemistry notes",
      description: "Collect important reactions and formulas.",
      reminderTime: new Date(Date.now() + 18 * 60 * 60 * 1000),
      isRecurring: false,
      notificationType: "email",
      priority: "medium",
    },
  ];

  const payments = [
    {
      userId: sampleUserIds[0],
      courseId: sampleCourseIds[0],
      orderId: `order_${Date.now()}_1`,
      amount: 2500,
      currency: "PKR",
      status: "completed",
      paymentMethod: "razorpay",
      description: "Course enrollment payment",
      subscriptionType: "none",
    },
    {
      userId: sampleUserIds[1],
      courseId: sampleCourseIds[1],
      orderId: `order_${Date.now()}_2`,
      amount: 3200,
      currency: "PKR",
      status: "completed",
      paymentMethod: "razorpay",
      description: "Course enrollment payment",
      subscriptionType: "monthly",
      subscriptionStartDate: new Date(),
      subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  ];

  const collaborativeNotes = [
    {
      title: "Chemistry Reaction Sheet",
      content: "Shared summary of the most important reactions.",
      forumId: sampleForumIds[1],
      createdBy: sampleUserIds[1],
      collaborators: [sampleUserIds[0], sampleUserIds[2]],
      tags: ["chemistry", "reactions"],
    },
    {
      title: "Algebra Formula Notes",
      content: "Handy algebra formulas for quick reference.",
      forumId: sampleForumIds[0],
      createdBy: sampleUserIds[0],
      collaborators: [sampleUserIds[2]],
      tags: ["algebra", "formulas"],
    },
  ];

  try {
    console.log("Clearing existing seedable collections...");
    await Promise.all([
      Achievement.deleteMany({}),
      Quest.deleteMany({}),
      UserAchievement.deleteMany({}),
      UserQuest.deleteMany({}),
      StudyGroup.deleteMany({}),
      StudySession.deleteMany({}),
      UserDocument.deleteMany({}),
      AssignmentSubmission.deleteMany({}),
      ResourceShare.deleteMany({}),
      ExpertQnA.deleteMany({}),
      StudyReminder.deleteMany({}),
      Payment.deleteMany({}),
      Category.deleteMany({}),
      Gamification.deleteMany({}),
      Resource.deleteMany({}),
      Reminder.deleteMany({}),
      StudyPartner.deleteMany({}),
      CollaborativeNote.deleteMany({}),
    ]);

    console.log("Seeding new records...");

    const createdCategories = await Category.insertMany(categories);
    console.log(`Created ${createdCategories.length} categories`);

    const createdGamifications = await Gamification.insertMany(gamifications);
    console.log(`Created ${createdGamifications.length} gamification records`);

    const createdResources = await Resource.insertMany(resources);
    console.log(`Created ${createdResources.length} resources`);

    const createdReminders = await Reminder.insertMany(reminders);
    console.log(`Created ${createdReminders.length} reminders`);

    const createdStudyPartners = await StudyPartner.insertMany(studyPartners);
    console.log(`Created ${createdStudyPartners.length} study partners`);

    const createdAchievements = await Achievement.insertMany(achievements);
    console.log(`Created ${createdAchievements.length} achievements`);

    const createdQuests = await Quest.insertMany(quests);
    console.log(`Created ${createdQuests.length} quests`);

    userAchievements[0].achievementId = createdAchievements[0]._id;
    userAchievements[1].achievementId = createdAchievements[1]._id;
    const createdUserAchievements =
      await UserAchievement.insertMany(userAchievements);
    console.log(`Created ${createdUserAchievements.length} user achievements`);

    const createdUserQuests = await UserQuest.insertMany(userQuests);
    console.log(`Created ${createdUserQuests.length} user quests`);

    const createdStudyGroups = await StudyGroup.insertMany(studyGroups);
    console.log(`Created ${createdStudyGroups.length} study groups`);

    const createdStudySessions = await StudySession.insertMany(studySessions);
    console.log(`Created ${createdStudySessions.length} study sessions`);

    const createdUserDocuments = await UserDocument.insertMany(userDocuments);
    console.log(`Created ${createdUserDocuments.length} user documents`);

    const createdAssignmentSubmissions = await AssignmentSubmission.insertMany(
      assignmentSubmissions,
    );
    console.log(
      `Created ${createdAssignmentSubmissions.length} assignment submissions`,
    );

    const createdResourceShares =
      await ResourceShare.insertMany(resourceShares);
    console.log(`Created ${createdResourceShares.length} resource shares`);

    const createdExpertQnAs = await ExpertQnA.insertMany(expertQnAs);
    console.log(`Created ${createdExpertQnAs.length} expert Q&A records`);

    const createdStudyReminders =
      await StudyReminder.insertMany(studyReminders);
    console.log(`Created ${createdStudyReminders.length} study reminders`);

    const createdPayments = await Payment.insertMany(payments);
    console.log(`Created ${createdPayments.length} payments`);

    const createdCollaborativeNotes =
      await CollaborativeNote.insertMany(collaborativeNotes);
    console.log(
      `Created ${createdCollaborativeNotes.length} collaborative notes`,
    );

    console.log("✅ Data seeding completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
};

connectDB().then(seedCollections);
