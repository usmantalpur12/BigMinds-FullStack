const mongoose = require('mongoose');

const studyGroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Study group name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true
  },
  maxMembers: {
    type: Number,
    required: [true, 'Maximum members is required'],
    min: [2, 'Minimum 2 members required'],
    max: [50, 'Maximum 50 members allowed']
  },
  currentMembers: {
    type: Number,
    default: 1
  },
  meetingTime: {
    type: String,
    required: [true, 'Meeting time is required']
  },
  meetingDay: {
    type: String,
    required: [true, 'Meeting day is required'],
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required']
  },
  forumId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Forum',
    required: [true, 'Forum is required']
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  topics: [{
    type: String,
    trim: true
  }],
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  meetingLink: {
    type: String,
    trim: true
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  joinCode: {
    type: String,
    unique: true,
    sparse: true
  }
}, {
  timestamps: true
});

// Index for better query performance
studyGroupSchema.index({ forumId: 1, isActive: 1 });
studyGroupSchema.index({ subject: 1 });
studyGroupSchema.index({ createdBy: 1 });

// Pre-save middleware to add creator as first member
studyGroupSchema.pre('save', function(next) {
  if (this.isNew && !this.members.includes(this.createdBy)) {
    this.members.push(this.createdBy);
  }
  next();
});

// Virtual for checking if group is full
studyGroupSchema.virtual('isFull').get(function() {
  return this.currentMembers >= this.maxMembers;
});

// Method to add member
studyGroupSchema.methods.addMember = function(userId) {
  if (this.members.includes(userId)) {
    throw new Error('User is already a member');
  }
  if (this.isFull) {
    throw new Error('Study group is full');
  }
  
  this.members.push(userId);
  this.currentMembers = this.members.length;
  return this.save();
};

// Method to remove member
studyGroupSchema.methods.removeMember = function(userId) {
  if (!this.members.includes(userId)) {
    throw new Error('User is not a member');
  }
  if (userId.equals(this.createdBy)) {
    throw new Error('Creator cannot leave the group');
  }
  
  this.members = this.members.filter(id => !id.equals(userId));
  this.currentMembers = this.members.length;
  return this.save();
};

module.exports = mongoose.model('StudyGroup', studyGroupSchema); 