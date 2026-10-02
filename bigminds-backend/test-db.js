const mongoose = require("mongoose");
require("dotenv").config();

mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log("MongoDB connected");
    const User = require("./models/User");
    const user = await User.findOne({ email: "admin@bigminds.com" }).select(
      "+password",
    );
    console.log("User found:", user ? user.email : "Not found");
    if (user) {
      const bcrypt = require("bcryptjs");
      const isMatch = await bcrypt.compare("admin123", user.password);
      console.log("Password match:", isMatch);
      console.log("User active:", user.isActive);
    }
    process.exit(0);
  })
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });
