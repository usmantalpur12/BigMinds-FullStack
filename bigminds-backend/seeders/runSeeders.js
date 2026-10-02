const mongoose = require("mongoose");
require("dotenv").config();

// Import seeders
const { seedGamification } = require("./gamificationSeeder");

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB Connected for seeding");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};

// Run all seeders
const runSeeders = async () => {
  try {
    console.log("🚀 Starting database seeding...");

    // Run gamification seeder
    await seedGamification();

    console.log("🎉 All seeders completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
};

// Run if this file is executed directly
if (require.main === module) {
  connectDB().then(runSeeders);
}

module.exports = { runSeeders };
