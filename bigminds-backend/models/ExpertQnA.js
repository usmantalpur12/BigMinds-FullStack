const mongoose = require('mongoose');

const expertQnASchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, 'Question is required'],
    trim: true,
    maxlength: [500, 'Question cannot exceed 500 characters']
  },
  answer: {
    type: String,
    trim: true,
    maxlength: [2000, 'Answer cannot exceed 2000 characters']
  },
  askedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Questioner is required']
  },
  answeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  forumId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Forum',
    required: [true, 'Forum is required']
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  status: {
    type: String,
    enum: ['open', 'answered', 'closed'],
    default: 'open'
  },
  upvotes: {
    type: Number,
    default: 0
  },
  downvotes: {
    type: Number,
    default: 0
  },
  tags: [{
    type: String,
    trim: true
  }],
  category: {
    type: String,
    trim: true
  },
  isUrgent: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  views: {
    type: Number,
    default: 0
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  attachments: [{
    type: String, // URLs to attached files
    trim: true
  }],
  relatedQuestions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExpertQnA'
  }],
  expertTags: [{
    type: String,
    trim: true
  }],
  estimatedTime: {
    type: Number, // in minutes
    default: 0
  },
  complexity: {
    type: String,
    enum: ['simple', 'moderate', 'complex'],
    default: 'moderate'
  }
}, {
  timestamps: true
});

// Index for better query performance
expertQnASchema.index({ forumId: 1, status: 1 });
expertQnASchema.index({ subject: 1 });
expertQnASchema.index({ difficulty: 1 });
expertQnASchema.index({ askedBy: 1 });
expertQnASchema.index({ tags: 1 });
expertQnASchema.index({ isUrgent: 1, priority: 1 });

// Virtual for total votes
expertQnASchema.virtual('totalVotes').get(function() {
  return this.upvotes - this.downvotes;
});

// Virtual for checking if question is urgent
expertQnASchema.virtual('isUrgentQuestion').get(function() {
  return this.isUrgent || this.priority === 'urgent';
});

// Method to upvote question
expertQnASchema.methods.upvote = function() {
  this.upvotes += 1;
  return this.save();
};

// Method to downvote question
expertQnASchema.methods.downvote = function() {
  this.downvotes += 1;
  return this.save();
};

// Method to answer question
expertQnASchema.methods.answerQuestion = function(answer, answeredBy) {
  this.answer = answer;
  this.answeredBy = answeredBy;
  this.status = 'answered';
  this.answeredAt = new Date();
  return this.save();
};

// Method to close question
expertQnASchema.methods.close = function() {
  this.status = 'closed';
  return this.save();
};

// Method to increment views
expertQnASchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

module.exports = mongoose.model('ExpertQnA', expertQnASchema); 