const mongoose = require('mongoose');

const resourceShareSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Resource title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  type: {
    type: String,
    required: [true, 'Resource type is required'],
    enum: ['document', 'video', 'link', 'quiz', 'note', 'presentation']
  },
  url: {
    type: String,
    required: [true, 'Resource URL is required'],
    trim: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Uploader is required']
  },
  forumId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Forum',
    required: [true, 'Forum is required']
  },
  tags: [{
    type: String,
    trim: true
  }],
  downloads: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 0,
    min: [0, 'Rating cannot be negative'],
    max: [5, 'Rating cannot exceed 5']
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  fileSize: {
    type: Number, // in bytes
    default: 0
  },
  fileType: {
    type: String,
    trim: true
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  isApproved: {
    type: Boolean,
    default: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  category: {
    type: String,
    trim: true
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  language: {
    type: String,
    default: 'English'
  }
}, {
  timestamps: true
});

// Index for better query performance
resourceShareSchema.index({ forumId: 1, type: 1 });
resourceShareSchema.index({ tags: 1 });
resourceShareSchema.index({ uploadedBy: 1 });
resourceShareSchema.index({ isApproved: 1, isPublic: 1 });

// Virtual for average rating
resourceShareSchema.virtual('averageRating').get(function() {
  return this.totalRatings > 0 ? (this.rating / this.totalRatings).toFixed(1) : 0;
});

// Method to add rating
resourceShareSchema.methods.addRating = function(newRating, userId) {
  if (newRating < 1 || newRating > 5) {
    throw new Error('Rating must be between 1 and 5');
  }
  
  // Check if user has already rated
  const existingRating = this.ratings?.find(r => r.userId.equals(userId));
  if (existingRating) {
    // Update existing rating
    this.rating = this.rating - existingRating.rating + newRating;
    existingRating.rating = newRating;
    existingRating.updatedAt = new Date();
  } else {
    // Add new rating
    this.rating += newRating;
    this.totalRatings += 1;
    if (!this.ratings) this.ratings = [];
    this.ratings.push({
      userId,
      rating: newRating,
      createdAt: new Date()
    });
  }
  
  return this.save();
};

// Method to increment download count
resourceShareSchema.methods.incrementDownloads = function() {
  this.downloads += 1;
  return this.save();
};

module.exports = mongoose.model('ResourceShare', resourceShareSchema); 