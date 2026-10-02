const mongoose = require('mongoose');

const studyReminderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  forumId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Forum',
    required: [true, 'Forum is required']
  },
  title: {
    type: String,
    required: [true, 'Reminder title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  reminderTime: {
    type: Date,
    required: [true, 'Reminder time is required']
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringDays: [{
    type: String,
    enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  category: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  notificationType: {
    type: String,
    enum: ['push', 'email', 'both'],
    default: 'push'
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  },
  snoozeCount: {
    type: Number,
    default: 0
  },
  lastSnoozed: {
    type: Date
  },
  snoozeUntil: {
    type: Date
  },
  relatedTopics: [{
    type: String,
    trim: true
  }],
  studyGoals: [{
    type: String,
    trim: true
  }],
  estimatedDuration: {
    type: Number, // in minutes
    default: 0
  }
}, {
  timestamps: true
});

// Index for better query performance
studyReminderSchema.index({ userId: 1, forumId: 1 });
studyReminderSchema.index({ reminderTime: 1 });
studyReminderSchema.index({ isActive: 1, isCompleted: 1 });
studyReminderSchema.index({ priority: 1 });

// Virtual for checking if reminder is overdue
studyReminderSchema.virtual('isOverdue').get(function() {
  if (this.isCompleted) return false;
  return new Date() > this.reminderTime;
});

// Virtual for checking if reminder is due soon (within 1 hour)
studyReminderSchema.virtual('isDueSoon').get(function() {
  if (this.isCompleted) return false;
  const now = new Date();
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
  return this.reminderTime <= oneHourFromNow && this.reminderTime > now;
});

// Method to mark reminder as completed
studyReminderSchema.methods.markCompleted = function() {
  this.isCompleted = true;
  this.completedAt = new Date();
  return this.save();
};

// Method to snooze reminder
studyReminderSchema.methods.snooze = function(minutes = 15) {
  this.snoozeCount += 1;
  this.lastSnoozed = new Date();
  this.snoozeUntil = new Date(Date.now() + minutes * 60 * 1000);
  return this.save();
};

// Method to activate reminder
studyReminderSchema.methods.activate = function() {
  this.isActive = true;
  return this.save();
};

// Method to deactivate reminder
studyReminderSchema.methods.deactivate = function() {
  this.isActive = false;
  return this.save();
};

// Pre-save middleware to validate recurring days
studyReminderSchema.pre('save', function(next) {
  if (this.isRecurring && (!this.recurringDays || this.recurringDays.length === 0)) {
    return next(new Error('Recurring reminders must have at least one recurring day'));
  }
  next();
});

module.exports = mongoose.model('StudyReminder', studyReminderSchema); 