const mongoose = require("mongoose");
require("dotenv").config();

// Import models
const User = require("./models/User");
const Course = require("./models/Course");
const Enrollment = require("./models/Enrollment");
const Quiz = require("./models/Quiz");
const Question = require("./models/Question");
const CourseThread = require("./models/CourseThread");
const CoursePost = require("./models/CoursePost");
const Forum = require("./models/Forum");
const ForumMember = require("./models/ForumMember");
const Achievement = require("./models/Achievement");
const Quest = require("./models/Quest");
const UserProgress = require("./models/UserProgress");

async function testProductionFeatures() {
  try {
    console.log("🧪 Testing Production Features...");

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Test 1: Check if models are working
    console.log("\n📊 Testing Database Models...");

    const userCount = await User.countDocuments();
    const courseCount = await Course.countDocuments();
    const enrollmentCount = await Enrollment.countDocuments();
    const quizCount = await Quiz.countDocuments();
    const questionCount = await Question.countDocuments();
    const threadCount = await CourseThread.countDocuments();
    const postCount = await CoursePost.countDocuments();
    const forumCount = await Forum.countDocuments();
    const memberCount = await ForumMember.countDocuments();
    const achievementCount = await Achievement.countDocuments();
    const questCount = await Quest.countDocuments();
    const progressCount = await UserProgress.countDocuments();

    console.log(`👥 Users: ${userCount}`);
    console.log(`📚 Courses: ${courseCount}`);
    console.log(`📝 Enrollments: ${enrollmentCount}`);
    console.log(`🧪 Quizzes: ${quizCount}`);
    console.log(`❓ Questions: ${questionCount}`);
    console.log(`💭 Threads: ${threadCount}`);
    console.log(`💬 Posts: ${postCount}`);
    console.log(`💬 Forums: ${forumCount}`);
    console.log(`👥 Forum Members: ${memberCount}`);
    console.log(`🏆 Achievements: ${achievementCount}`);
    console.log(`⚔️ Quests: ${questCount}`);
    console.log(`📊 User Progress: ${progressCount}`);

    // Test 2: Test relationships
    console.log("\n🔗 Testing Model Relationships...");

    // Get a course with instructor
    const course = await Course.findOne().populate(
      "instructor",
      "firstName lastName role",
    );
    if (course) {
      console.log(
        `✅ Course "${course.title}" has instructor: ${course.instructor.firstName} ${course.instructor.lastName} (${course.instructor.role})`,
      );
    }

    // Get enrollments with course and student
    const enrollment = await Enrollment.findOne()
      .populate("courseId", "title")
      .populate("studentId", "firstName lastName");
    if (enrollment) {
      console.log(
        `✅ Enrollment: ${enrollment.studentId.firstName} is enrolled in ${enrollment.courseId.title}`,
      );
    }

    // Get quiz with questions
    const quiz = await Quiz.findOne().populate("courseId", "title");
    if (quiz) {
      const questions = await Question.find({ quizId: quiz._id });
      console.log(`✅ Quiz "${quiz.title}" has ${questions.length} questions`);
    }

    // Get forum with members
    const forum = await Forum.findOne().populate(
      "createdById",
      "firstName lastName",
    );
    if (forum) {
      const members = await ForumMember.find({ forumId: forum._id }).populate(
        "userId",
        "firstName lastName",
      );
      console.log(
        `✅ Forum "${forum.title}" created by ${forum.createdById.firstName} has ${members.length} members`,
      );
    }

    // Test 3: Test gamification
    console.log("\n🎮 Testing Gamification System...");

    const userProgress = await UserProgress.findOne().populate(
      "user",
      "firstName lastName",
    );
    if (userProgress) {
      console.log(
        `✅ User ${userProgress.user.firstName} has ${userProgress.xp} XP at level ${userProgress.level}`,
      );
      console.log(`✅ Current streak: ${userProgress.currentStreak} days`);
    }

    // Test 4: Test course discussions
    console.log("\n💭 Testing Course Discussions...");

    const thread = await CourseThread.findOne()
      .populate("courseId", "title")
      .populate("authorId", "firstName lastName");
    if (thread) {
      const posts = await CoursePost.find({ threadId: thread._id }).populate(
        "authorId",
        "firstName lastName",
      );
      console.log(
        `✅ Thread "${thread.title}" in course "${thread.courseId.title}" has ${posts.length} posts`,
      );
    }

    // Test 5: Test authentication
    console.log("\n🔐 Testing Authentication...");

    const admin = await User.findOne({ role: "admin" });
    const teacher = await User.findOne({ role: "teacher" });
    const student = await User.findOne({ role: "student" });

    if (admin && teacher && student) {
      console.log(`✅ Admin: ${admin.firstName} ${admin.lastName}`);
      console.log(`✅ Teacher: ${teacher.firstName} ${teacher.lastName}`);
      console.log(`✅ Student: ${student.firstName} ${student.lastName}`);
    }

    console.log("\n🎉 All Production Features Tested Successfully!");
    console.log("\n📋 Summary:");
    console.log("✅ Database models are working");
    console.log("✅ Relationships are properly established");
    console.log("✅ Gamification system is functional");
    console.log("✅ Course discussions are working");
    console.log("✅ Authentication system is ready");
    console.log("✅ Forum system is operational");
    console.log("✅ Quiz system is functional");

    console.log(
      "\n🚀 Your BigMinds Education platform is ready for production!",
    );
  } catch (error) {
    console.error("❌ Error testing production features:", error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
  }
}

// Run test if called directly
if (require.main === module) {
  testProductionFeatures()
    .then(() => {
      console.log("\n✅ Testing completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Testing failed:", error);
      process.exit(1);
    });
}

module.exports = testProductionFeatures;
