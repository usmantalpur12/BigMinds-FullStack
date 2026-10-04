const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

// Import routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const courseRoutes = require("./routes/courses");
const forumsRoutes = require("./routes/forums");
const quizRoutes = require("./routes/quizzes");
const paymentRoutes = require("./routes/payments");
const uploadRoutes = require("./routes/upload");
const gamificationRoutes = require("./routes/gamification");
const categoryRoutes = require("./routes/categories");
const gamificationsRoutes = require("./routes/gamifications");
const resourcesRoutes = require("./routes/resources");
const remindersRoutes = require("./routes/reminders");
const studyPartnersRoutes = require("./routes/studyPartners");
const assignmentRoutes = require("./routes/assignments");
const courseDiscussionRoutes = require("./routes/courseDiscussion");
const aiRoutes = require("./routes/ai");
const profileRoutes = require("./routes/profile");
const jobsRoutes = require("./routes/jobs");

// Import middleware
const { errorHandler } = require("./middleware/errorHandler");
const logger = require("./middleware/logger");
const auth = require("./middleware/auth");

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
// Enforce FRONTEND_URL in production to avoid open CORS policies
if (process.env.NODE_ENV === "production" && !process.env.FRONTEND_URL) {
  console.error(
    "FATAL: FRONTEND_URL must be set in production. Refusing to start.",
  );
  process.exit(1);
}

app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production" ? [process.env.FRONTEND_URL] : true, // Allow all origins for mobile app testing in non-prod
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api/", limiter);

// Body parser
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Static files
app.use("/uploads", express.static("uploads"));

// Request logging
app.use(logger);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: " BigMinds API is running smoothly!",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: process.env.API_VERSION || "v1",
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/forums", forumsRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/gamification", gamificationRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/gamifications", gamificationsRoutes);
app.use("/api/resources", resourcesRoutes);
app.use("/api/reminders", remindersRoutes);
app.use("/api/study-partners", studyPartnersRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/course-discussion", courseDiscussionRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/jobs", jobsRoutes);

// Error handling middleware
app.use(errorHandler);

// Export the Express app BEFORE async MongoDB connection.
// In Vercel serverless functions, module-level exports must be available
// synchronously — otherwise FUNCTION_INVOCATION_FAILED occurs.
module.exports = app;

// MongoDB connection and server startup: start listening only after DB connects
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGODB_URI, {
    // mongoose 7+ no longer needs useNewUrlParser/useUnifiedTopology flags, but keep options object for future additions
  })
  .then(() => {
    console.log("MongoDB connected successfully");

    // Only start server when not in serverless environment
    if (!process.env.VERCEL) {
      const server = app.listen(PORT, "0.0.0.0", () => {
        console.log("Server running on port " + PORT);
        console.log("Environment: " + process.env.NODE_ENV);
        console.log("API Base URL: http://0.0.0.0:" + PORT + "/api");
        console.log("Local API URL: http://localhost:" + PORT + "/api");
      });

      // Socket.io setup for real-time features
      const io = require("socket.io")(server, {
        cors: {
          origin:
            process.env.NODE_ENV === "production"
              ? [process.env.FRONTEND_URL]
              : ["http://localhost:3000", "http://localhost:19006"],
          methods: ["GET", "POST"],
        },
      });

      // Socket.io connection handling (unchanged logic)
      io.on("connection", (socket) => {
        console.log("User connected: " + socket.id);

        socket.on("join_course", (courseId) => {
          socket.join("course_" + courseId);
        });

        socket.on("leave_course", (courseId) => {
          socket.leave("course_" + courseId);
        });

        socket.on("quiz_update", (data) => {
          socket.to("course_" + data.courseId).emit("quiz_update", data);
        });

        socket.on("join_forum", (forumId) => {
          socket.join("forum_" + forumId);
          socket.to("forum_" + forumId).emit("user_joined_forum", {
            forumId,
            socketId: socket.id,
            timestamp: new Date().toISOString(),
          });
        });

        socket.on("leave_forum", (forumId) => {
          socket.leave("forum_" + forumId);
          socket.to("forum_" + forumId).emit("user_left_forum", {
            forumId,
            socketId: socket.id,
            timestamp: new Date().toISOString(),
          });
        });

        socket.on("forum_message", (data) => {
          const { forumId, message, userId, userName, avatar } = data;
          const messageData = {
            id: Date.now().toString(),
            text: message,
            user: { id: userId, name: userName, avatar: avatar || "" },
            forumId,
            timestamp: new Date().toISOString(),
          };
          io.to("forum_" + forumId).emit("forum_message", messageData);
        });

        socket.on("forum_typing", (data) => {
          const { forumId, userId, userName, isTyping } = data;
          socket.to("forum_" + forumId).emit("forum_typing", {
            userId,
            userName,
            forumId,
            isTyping,
            timestamp: new Date().toISOString(),
          });
        });

        socket.on("forum_update", (data) => {
          const { forumId, type, update } = data;
          socket.to("forum_" + forumId).emit("forum_update", {
            type,
            update,
            timestamp: new Date().toISOString(),
          });
        });

        socket.on("disconnect", () => {
          console.log("User disconnected: " + socket.id);
        });
      });

      // Graceful shutdown
      process.on("SIGTERM", () => {
        console.log("SIGTERM received - shutting down");
        server.close(() => {
          console.log("Process terminated");
        });
      });
    }
  })
    .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    // In serverless environments (Vercel), don't exit — let the function continue
    // so that health check and other non-DB endpoints remain available.
    if (!process.env.VERCEL) {
      process.exit(1);
    }
  });
