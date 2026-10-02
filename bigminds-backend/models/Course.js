const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Course title is required"],
      trim: true,
      maxlength: [100, "Title cannot be more than 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Course description is required"],
      maxlength: [1000, "Description cannot be more than 1000 characters"],
    },
    shortDescription: {
      type: String,
      maxlength: [200, "Short description cannot be more than 200 characters"],
    },
    category: {
      type: String,
      required: [true, "Course category is required"],
      enum: ["pre-engineering", "pre-medical", "computer-science", "bba", "o-levels", "a-levels"],
    },
    class: {
      type: String,
      required: [true, "Course class is required"],
      enum: ["9", "10", "11", "12", "o-level", "a-level"],
    },
    level: {
      type: String,
      required: [true, "Course level is required"],
      enum: ["beginner", "intermediate", "advanced"],
    },
    price: {
      type: Number,
      default: 0,
      min: [0, "Price cannot be negative"],
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Course instructor is required"],
    },
    instructorName: {
      type: String,
      required: [true, "Instructor name is required"],
    },
    thumbnail: {
      type: String,
      default: null,
    },
    introVideo: {
      type: String,
      default: null,
    },
    totalVideos: {
      type: Number,
      default: 0,
      min: [0, "Total videos cannot be negative"],
    },
    whatYouWillLearn: {
      type: [String],
      default: [],
    },
    learningOutcomes: {
      type: [String],
      default: [],
    },
    studyMaterials: [
      {
        title: String,
        type: {
          type: String,
          enum: ["pdf", "doc", "video", "link", "other"],
        },
        url: String,
        fileUrl: String,
      },
    ],
    links: [
      {
        title: String,
        url: String,
        description: String,
      },
    ],
    hasForum: {
      type: Boolean,
      default: true,
    },
    hasQuizzes: {
      type: Boolean,
      default: true,
    },
    lessons: [
      {
        title: {
          type: String,
          required: true,
        },
        description: String,
        videoUrl: String,
        duration: Number, // in minutes
        order: Number,
        isFree: {
          type: Boolean,
          default: false,
        },
      },
    ],
    enrolledStudents: [
      {
        student: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        enrolledAt: {
          type: Date,
          default: Date.now,
        },
        progress: {
          type: Number,
          default: 0,
          min: 0,
          max: 100,
        },
      },
    ],
    totalStudents: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalRatings: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    tags: [String],
  },
  {
    timestamps: true,
  }
);

// Index for better performance
courseSchema.index({ category: 1, class: 1 });
courseSchema.index({ category: 1, class: 1, isPublished: 1 });

module.exports = mongoose.model("Course", courseSchema); 