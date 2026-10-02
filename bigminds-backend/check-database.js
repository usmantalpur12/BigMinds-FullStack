// Database Statistics Checker
// Run with: node check-database.js

require("dotenv").config();
const mongoose = require("mongoose");

async function checkDatabase() {
  try {
    console.log("🔌 Connecting to MongoDB...\n");
    console.log(
      "📍 MongoDB URI:",
      process.env.MONGODB_URI || "mongodb://localhost:27017/bigminds",
    );

    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/bigminds",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      },
    );

    console.log("✅ Connected to MongoDB successfully!\n");
    console.log("=".repeat(60));
    console.log("📊 DATABASE STATISTICS");
    console.log("=".repeat(60));
    console.log("");

    // Get database name
    const db = mongoose.connection.db;
    const dbName = db.databaseName;
    console.log(`📁 Database Name: ${dbName}\n`);

    // Get all collections
    const collections = await db.listCollections().toArray();

    console.log(`📋 Total Collections: ${collections.length}\n`);
    console.log("-".repeat(60));

    // Create array to store collection stats
    const stats = [];

    // Get stats for each collection
    for (const collection of collections) {
      const collectionName = collection.name;
      const count = await db.collection(collectionName).countDocuments();

      // Get collection size
      const statsData = await db.collection(collectionName).stats();
      const sizeInKB = (statsData.size / 1024).toFixed(2);
      const sizeInMB = (statsData.size / (1024 * 1024)).toFixed(2);

      stats.push({
        name: collectionName,
        count: count,
        size: statsData.size,
        sizeKB: sizeInKB,
        sizeMB: sizeInMB,
      });
    }

    // Sort by document count (descending)
    stats.sort((a, b) => b.count - a.count);

    // Display table
    console.log("\n📊 COLLECTION STATISTICS:\n");
    console.log(
      "Collection Name".padEnd(30) +
        "Documents".padEnd(15) +
        "Size (KB)".padEnd(15) +
        "Size (MB)",
    );
    console.log("-".repeat(75));

    let totalDocuments = 0;
    let totalSize = 0;

    stats.forEach((stat) => {
      const countStr = stat.count.toString().padEnd(15);
      const sizeKBStr = stat.sizeKB.padEnd(15);
      const sizeMBStr = stat.sizeMB;

      console.log(stat.name.padEnd(30) + countStr + sizeKBStr + sizeMBStr);

      totalDocuments += stat.count;
      totalSize += stat.size;
    });

    console.log("-".repeat(75));
    console.log(
      "TOTAL".padEnd(30) +
        totalDocuments.toString().padEnd(15) +
        (totalSize / 1024).toFixed(2).padEnd(15) +
        (totalSize / (1024 * 1024)).toFixed(2),
    );

    console.log("\n" + "=".repeat(60));
    console.log("\n📋 DETAILED VIEW:\n");

    // Show detailed info for each collection
    for (const stat of stats) {
      if (stat.count > 0) {
        console.log(`\n📦 ${stat.name.toUpperCase()}:`);
        console.log(`   Documents: ${stat.count}`);
        console.log(`   Size: ${stat.sizeKB} KB (${stat.sizeMB} MB)`);

        // Get sample document structure for first 5 collections
        if (stats.indexOf(stat) < 5) {
          const sample = await db.collection(stat.name).findOne();
          if (sample) {
            console.log(`   Sample Fields: ${Object.keys(sample).join(", ")}`);
          }
        }
      }
    }

    // Check for common BigMinds collections
    console.log("\n" + "=".repeat(60));
    console.log("\n🎯 BIGMINDS SPECIFIC COLLECTIONS:\n");

    const expectedCollections = [
      "users",
      "courses",
      "forums",
      "forummembers",
      "forumthreads",
      "forumposts",
      "enrollments",
      "quizzes",
      "assignments",
      "payments",
      "categories",
      "gamifications",
      "coursethreads",
      "courseposts",
      "studygroups",
      "studysessions",
      "resources",
      "reminders",
      "collaborativenotes",
      "studypartners",
    ];

    expectedCollections.forEach((collectionName) => {
      const found = stats.find(
        (s) => s.name.toLowerCase() === collectionName.toLowerCase(),
      );
      if (found) {
        console.log(`✅ ${collectionName.padEnd(30)} ${found.count} documents`);
      } else {
        console.log(`❌ ${collectionName.padEnd(30)} Not found`);
      }
    });

    console.log("\n" + "=".repeat(60));
    console.log("\n✅ Database check completed!\n");

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error checking database:", error);
    process.exit(1);
  }
}

checkDatabase();
