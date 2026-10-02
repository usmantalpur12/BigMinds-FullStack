const mongoose = require("mongoose");
require("dotenv").config();

const User = require("./models/User");

async function testLogin() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected");

    // Test with admin user
    const testEmail = "admin@bigminds.com";
    const testPassword = "admin123";

    console.log(`\n🔍 Testing login for: ${testEmail}`);

    // Check if user exists
    const user = await User.findOne({ email: testEmail }).select("+password");

    if (!user) {
      console.log("❌ User not found in database!");
      console.log("💡 Run the seeder: node seeders/productionSeeder.js");
      process.exit(1);
    }

    console.log("✅ User found:");
    console.log(`   - Name: ${user.firstName} ${user.lastName}`);
    console.log(`   - Email: ${user.email}`);
    console.log(`   - Role: ${user.role}`);
    console.log(`   - Active: ${user.isActive}`);
    console.log(`   - Has Password: ${!!user.password}`);
    console.log(
      `   - Password Hash: ${user.password ? user.password.substring(0, 20) + "..." : "N/A"}`,
    );

    // Test password comparison
    console.log(`\n🔐 Testing password comparison...`);
    const isMatch = await user.comparePassword(testPassword);
    console.log(`   Password match: ${isMatch ? "✅ YES" : "❌ NO"}`);

    if (!isMatch) {
      console.log("\n❌ Password comparison failed!");
      console.log("💡 Possible issues:");
      console.log("   1. Password was not hashed during user creation");
      console.log("   2. Password in database is incorrect");
      console.log("   3. User model pre-save hook not working");

      // Try direct bcrypt comparison
      const bcrypt = require("bcryptjs");
      const directMatch = await bcrypt.compare(testPassword, user.password);
      console.log(
        `   Direct bcrypt compare: ${directMatch ? "✅ YES" : "❌ NO"}`,
      );
    } else {
      console.log("\n✅ Login test PASSED!");
      console.log("💡 If login still fails, check:");
      console.log("   1. Request body format (email and password fields)");
      console.log("   2. Email normalization (should be lowercase)");
      console.log("   3. Server logs for detailed error messages");
    }

    // List all users
    console.log("\n📋 All users in database:");
    const allUsers = await User.find({}).select("email role isActive");
    allUsers.forEach((u) => {
      console.log(`   - ${u.email} (${u.role}) - Active: ${u.isActive}`);
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

testLogin();
