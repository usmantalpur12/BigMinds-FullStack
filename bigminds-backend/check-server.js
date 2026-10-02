// Quick script to check if server can start and connect to MongoDB
require("dotenv").config();
const mongoose = require("mongoose");
const http = require("http");

console.log("🔍 Checking Backend Server Configuration...\n");

// Check environment variables
console.log("📋 Environment Variables:");
console.log("   PORT:", process.env.PORT || "5000 (default)");
console.log("   NODE_ENV:", process.env.NODE_ENV || "not set");
console.log("   MONGODB_URI:", process.env.MONGODB_URI || "not set");
console.log("");

// Test MongoDB connection
console.log("🔌 Testing MongoDB Connection...");
mongoose.connect(
  process.env.MONGODB_URI || "mongodb://localhost:27017/bigminds",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
);

mongoose.connection.on("connected", () => {
  console.log("   ✅ MongoDB connected successfully!");
  testServer();
});

mongoose.connection.on("error", (error) => {
  console.log("   ❌ MongoDB connection failed:", error.message);
  console.log("   💡 Make sure MongoDB is running: mongod");
  process.exit(1);
});

function testServer() {
  console.log("\n🌐 Testing Server Port...");
  const PORT = process.env.PORT || 5000;

  // Check if port is already in use
  const testServer = http.createServer();
  testServer.listen(PORT, "0.0.0.0", () => {
    console.log(`   ✅ Port ${PORT} is available`);
    testServer.close(() => {
      console.log("\n✅ All checks passed! You can start the server with:");
      console.log("   npm start");
      console.log("   or");
      console.log("   npm run dev");
      process.exit(0);
    });
  });

  testServer.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.log(`   ⚠️  Port ${PORT} is already in use`);
      console.log("   💡 Another server might be running on this port");
      console.log("   💡 You can kill it or use a different port");
    } else {
      console.log(`   ❌ Error: ${error.message}`);
    }
    process.exit(1);
  });
}

// Timeout after 10 seconds
setTimeout(() => {
  console.log("\n⏱️  Connection timeout - MongoDB might not be running");
  console.log("   💡 Start MongoDB: mongod");
  process.exit(1);
}, 10000);
