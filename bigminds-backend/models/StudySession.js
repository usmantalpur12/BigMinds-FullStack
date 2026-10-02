const mongoose = require('mongoose');

const studySessionSchema = new mongoose.Schema({
  forumId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Forum',
    required: [true, 'Forum is required']
  },
  title: {
    type: String,
    required: [true, 'Session title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  startTime: {
    type: Date,
    required: [true, 'Start time is required']
  },
  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    min: [15, 'Minimum duration is 15 minutes'],
    max: [480, 'Maximum duration is 8 hours']
  },
  maxParticipants: {
    type: Number,
    required: [true, 'Maximum participants is required'],
    min: [2, 'Minimum 2 participants required'],
    max: [100, 'Maximum 100 participants allowed']
  },
  currentParticipants: {
    type: Number,
    default: 0
  },
  topics: [{
    type: String,
    trim: true
  }],
  isLive: {
    type: Boolean,
    default: false
  },
  recordingUrl: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required']
  },
  participants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  status: {
    type: String,
    enum: ['scheduled', 'live', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  meetingLink: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  isPrivate: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for better query performance
studySessionSchema.index({ forumId: 1, startTime: 1 });
studySessionSchema.index({ status: 1, startTime: 1 });
studySessionSchema.index({ createdBy: 1 });

// Virtual for end time
studySessionSchema.virtual('endTime').get(function() {
  return new Date(this.startTime.getTime() + this.duration * 60000);
});

// Virtual for checking if session is full
studySessionSchema.virtual('isFull').get(function() {
  return this.currentParticipants >= this.maxParticipants;
});

// Virtual for checking if session is ongoing
studySessionSchema.virtual('isOngoing').get(function() {
  const now = new Date();
  return this.startTime <= now && now <= this.endTime;
});

// Method to add participant
studySessionSchema.methods.addParticipant = function(userId) {
  if (this.isFull) {
    throw new Error('Study session is full');
  }
  
  const existingParticipant = this.participants.find(p => p.userId.equals(userId));
  if (existingParticipant) {
    throw new Error('User is already a participant');
  }
  
  this.participants.push({ userId });
  this.currentParticipants = this.participants.length;
  return this.save();
};

// Method to remove participant
studySessionSchema.methods.removeParticipant = function(userId) {
  const participantIndex = this.participants.findIndex(p => p.userId.equals(userId));
  if (participantIndex === -1) {
    throw new Error('User is not a participant');
  }
  
  this.participants.splice(participantIndex, 1);
  this.currentParticipants = this.participants.length;
  return this.save();
};

module.exports = mongoose.model('StudySession', studySessionSchema); 