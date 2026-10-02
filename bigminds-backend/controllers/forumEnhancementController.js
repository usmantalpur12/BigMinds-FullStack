const StudyGroup = require("../models/StudyGroup");
const StudySession = require("../models/StudySession");
const ResourceShare = require("../models/ResourceShare");
const ExpertQnA = require("../models/ExpertQnA");
const StudyReminder = require("../models/StudyReminder");
const { catchAsync } = require("../middleware/errorHandler");

// ===== STUDY GROUPS =====

// Get study groups for a forum
exports.getStudyGroups = catchAsync(async (req, res) => {
  const forumId = req.params.id;
  const { page = 1, limit = 20, subject } = req.query;
  
  let query = { forumId, isActive: true };
  if (subject) {
    query.subject = { $regex: subject, $options: 'i' };
  }
  
  const studyGroups = await StudyGroup.find(query)
    .populate('createdBy', 'firstName lastName avatar')
    .populate('members', 'firstName lastName avatar')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);
  
  const total = await StudyGroup.countDocuments(query);
  
  res.status(200).json({
    success: true,
    data: studyGroups,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// Create study group
exports.createStudyGroup = catchAsync(async (req, res) => {
  const studyGroupData = {
    ...req.body,
    forumId: req.params.id,
    createdBy: req.user.id
  };
  
  const studyGroup = await StudyGroup.create(studyGroupData);
  
  // Populate creator info
  await studyGroup.populate('createdBy', 'firstName lastName avatar');
  
  res.status(201).json({
    success: true,
    data: studyGroup,
    message: 'Study group created successfully'
  });
});

// Join study group
exports.joinStudyGroup = catchAsync(async (req, res) => {
  const { groupId } = req.params;
  
  const studyGroup = await StudyGroup.findById(groupId);
  if (!studyGroup) {
    return res.status(404).json({
      success: false,
      message: 'Study group not found'
    });
  }
  
  if (studyGroup.isFull) {
    return res.status(400).json({
      success: false,
      message: 'Study group is full'
    });
  }
  
  try {
    await studyGroup.addMember(req.user.id);
    
    res.status(200).json({
      success: true,
      message: 'Joined study group successfully'
    });
  } catch (error) {
    if (error.message === 'User is already a member') {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of this study group'
      });
    }
    throw error;
  }
});

// Leave study group
exports.leaveStudyGroup = catchAsync(async (req, res) => {
  const { groupId } = req.params;
  
  const studyGroup = await StudyGroup.findById(groupId);
  if (!studyGroup) {
    return res.status(404).json({
      success: false,
      message: 'Study group not found'
    });
  }
  
  await studyGroup.removeMember(req.user.id);
  
  res.status(200).json({
    success: true,
    message: 'Left study group successfully'
  });
});

// ===== STUDY SESSIONS =====

// Get study sessions for a forum
exports.getStudySessions = catchAsync(async (req, res) => {
  const forumId = req.params.id;
  const { page = 1, limit = 20, status } = req.query;
  
  let query = { forumId };
  if (status && status !== 'all') {
    query.status = status;
  }
  
  const studySessions = await StudySession.find(query)
    .populate('createdBy', 'firstName lastName avatar')
    .populate('participants.userId', 'firstName lastName avatar')
    .sort({ startTime: 1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);
  
  const total = await StudySession.countDocuments(query);
  
  res.status(200).json({
    success: true,
    data: studySessions,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// Create study session
exports.createStudySession = catchAsync(async (req, res) => {
  const sessionData = {
    ...req.body,
    forumId: req.params.id,
    createdBy: req.user.id
  };
  
  const studySession = await StudySession.create(sessionData);
  
  // Add creator as first participant
  await studySession.addParticipant(req.user.id);
  
  // Populate creator info
  await studySession.populate('createdBy', 'firstName lastName avatar');
  
  res.status(201).json({
    success: true,
    data: studySession,
    message: 'Study session created successfully'
  });
});

// Join study session
exports.joinStudySession = catchAsync(async (req, res) => {
  const { sessionId } = req.params;
  
  const studySession = await StudySession.findById(sessionId);
  if (!studySession) {
    return res.status(404).json({
      success: false,
      message: 'Study session not found'
    });
  }
  
  if (studySession.isFull) {
    return res.status(400).json({
      success: false,
      message: 'Study session is full'
    });
  }
  
  await studySession.addParticipant(req.user.id);
  
  res.status(200).json({
    success: true,
    message: 'Joined study session successfully'
  });
});

// ===== RESOURCES =====

// Get resources for a forum
exports.getResources = catchAsync(async (req, res) => {
  const forumId = req.params.id;
  const { page = 1, limit = 20, type, subject } = req.query;
  
  let query = { forumId, isApproved: true, isPublic: true };
  if (type) {
    query.type = type;
  }
  if (subject) {
    query.tags = { $regex: subject, $options: 'i' };
  }
  
  const resources = await ResourceShare.find(query)
    .populate('uploadedBy', 'firstName lastName avatar')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);
  
  const total = await ResourceShare.countDocuments(query);
  
  res.status(200).json({
    success: true,
    data: resources,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// Create resource
exports.createResource = catchAsync(async (req, res) => {
  const resourceData = {
    ...req.body,
    forumId: req.params.id,
    uploadedBy: req.user.id
  };
  
  const resource = await ResourceShare.create(resourceData);
  
  // Populate uploader info
  await resource.populate('uploadedBy', 'firstName lastName avatar');
  
  res.status(201).json({
    success: true,
    data: resource,
    message: 'Resource shared successfully'
  });
});

// Download resource (increment download count)
exports.downloadResource = catchAsync(async (req, res) => {
  const { resourceId } = req.params;
  
  const resource = await ResourceShare.findById(resourceId);
  if (!resource) {
    return res.status(404).json({
      success: false,
      message: 'Resource not found'
    });
  }
  
  await resource.incrementDownloads();
  
  res.status(200).json({
    success: true,
    data: { url: resource.url },
    message: 'Download link provided'
  });
});

// ===== EXPERT Q&A =====

// Get expert Q&A for a forum
exports.getExpertQnA = catchAsync(async (req, res) => {
  const forumId = req.params.id;
  const { page = 1, limit = 20, status, difficulty, subject } = req.query;
  
  let query = { forumId };
  if (status && status !== 'all') {
    query.status = status;
  }
  if (difficulty && difficulty !== 'all') {
    query.difficulty = difficulty;
  }
  if (subject) {
    query.subject = { $regex: subject, $options: 'i' };
  }
  
  const qaList = await ExpertQnA.find(query)
    .populate('askedBy', 'firstName lastName avatar')
    .populate('answeredBy', 'firstName lastName avatar')
    .sort({ isUrgent: -1, priority: -1, createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);
  
  const total = await ExpertQnA.countDocuments(query);
  
  res.status(200).json({
    success: true,
    data: qaList,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// Create expert Q&A question
exports.createExpertQnA = catchAsync(async (req, res) => {
  const qaData = {
    ...req.body,
    forumId: req.params.id,
    askedBy: req.user.id
  };
  
  const expertQnA = await ExpertQnA.create(qaData);
  
  // Populate asker info
  await expertQnA.populate('askedBy', 'firstName lastName avatar');
  
  res.status(201).json({
    success: true,
    data: expertQnA,
    message: 'Question posted successfully'
  });
});

// Answer a question
exports.answerQuestion = catchAsync(async (req, res) => {
  const { qaId } = req.params;
  const { answer } = req.body;
  
  const expertQnA = await ExpertQnA.findById(qaId);
  if (!expertQnA) {
    return res.status(404).json({
      success: false,
      message: 'Question not found'
    });
  }
  
  if (expertQnA.status === 'closed') {
    return res.status(400).json({
      success: false,
      message: 'Question is closed'
    });
  }
  
  await expertQnA.answerQuestion(answer, req.user.id);
  
  // Populate answerer info
  await expertQnA.populate('answeredBy', 'firstName lastName avatar');
  
  res.status(200).json({
    success: true,
    data: expertQnA,
    message: 'Question answered successfully'
  });
});

// Upvote question
exports.upvoteQuestion = catchAsync(async (req, res) => {
  const { qaId } = req.params;
  
  const expertQnA = await ExpertQnA.findById(qaId);
  if (!expertQnA) {
    return res.status(404).json({
      success: false,
      message: 'Question not found'
    });
  }
  
  await expertQnA.upvote();
  
  res.status(200).json({
    success: true,
    message: 'Question upvoted successfully'
  });
});

// Downvote question
exports.downvoteQuestion = catchAsync(async (req, res) => {
  const { qaId } = req.params;
  
  const expertQnA = await ExpertQnA.findById(qaId);
  if (!expertQnA) {
    return res.status(404).json({
      success: false,
      message: 'Question not found'
    });
  }
  
  await expertQnA.downvote();
  
  res.status(200).json({
    success: true,
    message: 'Question downvoted successfully'
  });
});

// ===== STUDY REMINDERS =====

// Get reminders for a forum
exports.getReminders = catchAsync(async (req, res) => {
  const forumId = req.params.id;
  const { page = 1, limit = 20, status } = req.query;
  
  let query = { forumId, userId: req.user.id };
  if (status === 'completed') {
    query.isCompleted = true;
  } else if (status === 'active') {
    query.isCompleted = false;
    query.isActive = true;
  } else if (status === 'overdue') {
    query.isCompleted = false;
    query.reminderTime = { $lt: new Date() };
  }
  
  const reminders = await StudyReminder.find(query)
    .populate('forumId', 'title')
    .sort({ reminderTime: 1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);
  
  const total = await StudyReminder.countDocuments(query);
  
  res.status(200).json({
    success: true,
    data: reminders,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// Create reminder
exports.createReminder = catchAsync(async (req, res) => {
  const reminderData = {
    ...req.body,
    forumId: req.params.id,
    userId: req.user.id
  };
  
  const reminder = await StudyReminder.create(reminderData);
  
  // Populate forum info
  await reminder.populate('forumId', 'title');
  
  res.status(201).json({
    success: true,
    data: reminder,
    message: 'Reminder created successfully'
  });
});

// Update reminder
exports.updateReminder = catchAsync(async (req, res) => {
  const { reminderId } = req.params;
  
  const reminder = await StudyReminder.findOne({
    _id: reminderId,
    userId: req.user.id
  });
  
  if (!reminder) {
    return res.status(404).json({
      success: false,
      message: 'Reminder not found'
    });
  }
  
  const updatedReminder = await StudyReminder.findByIdAndUpdate(
    reminderId,
    req.body,
    { new: true, runValidators: true }
  ).populate('forumId', 'title');
  
  res.status(200).json({
    success: true,
    data: updatedReminder,
    message: 'Reminder updated successfully'
  });
});

// Delete reminder
exports.deleteReminder = catchAsync(async (req, res) => {
  const { reminderId } = req.params;
  
  const reminder = await StudyReminder.findOneAndDelete({
    _id: reminderId,
    userId: req.user.id
  });
  
  if (!reminder) {
    return res.status(404).json({
      success: false,
      message: 'Reminder not found'
    });
  }
  
  res.status(200).json({
    success: true,
    message: 'Reminder deleted successfully'
  });
});

// Mark reminder as completed
exports.completeReminder = catchAsync(async (req, res) => {
  const { reminderId } = req.params;
  
  const reminder = await StudyReminder.findOne({
    _id: reminderId,
    userId: req.user.id
  });
  
  if (!reminder) {
    return res.status(404).json({
      success: false,
      message: 'Reminder not found'
    });
  }
  
  await reminder.markCompleted();
  
  res.status(200).json({
    success: true,
    message: 'Reminder marked as completed'
  });
});

// ===== COLLABORATIVE NOTES =====

// Create collaborative note
exports.createCollaborativeNote = catchAsync(async (req, res) => {
  const { title, content, forumId, collaborators, tags } = req.body;
  
  const CollaborativeNote = require("../models/CollaborativeNote");
  
  const note = await CollaborativeNote.create({
    title,
    content,
    forumId,
    createdBy: req.user.id,
    collaborators: collaborators || [req.user.id],
    tags: tags || [],
  });
  
  res.status(201).json({
    success: true,
    data: note,
    message: 'Collaborative note created successfully'
  });
});

// Get collaborative notes for a forum
exports.getCollaborativeNotes = catchAsync(async (req, res) => {
  const { forumId } = req.params;
  
  const CollaborativeNote = require("../models/CollaborativeNote");
  
  const notes = await CollaborativeNote.find({
    forumId,
    $or: [
      { createdBy: req.user.id },
      { collaborators: req.user.id }
    ]
  })
    .populate('createdBy', 'firstName lastName avatar')
    .populate('collaborators', 'firstName lastName avatar')
    .sort({ updatedAt: -1 });
  
  res.status(200).json({
    success: true,
    data: notes
  });
});

// Update collaborative note
exports.updateCollaborativeNote = catchAsync(async (req, res) => {
  const { noteId } = req.params;
  const { title, content, tags } = req.body;
  
  const CollaborativeNote = require("../models/CollaborativeNote");
  
  const note = await CollaborativeNote.findOne({
    _id: noteId,
    $or: [
      { createdBy: req.user.id },
      { collaborators: req.user.id }
    ]
  });
  
  if (!note) {
    return res.status(404).json({
      success: false,
      message: 'Note not found or access denied'
    });
  }
  
  if (title) note.title = title;
  if (content) note.content = content;
  if (tags) note.tags = tags;
  
  await note.save();
  
  res.status(200).json({
    success: true,
    data: note,
    message: 'Note updated successfully'
  });
});

// ===== STUDY PARTNERS MATCHING =====

// Get study partners for a forum
exports.getStudyPartners = catchAsync(async (req, res) => {
  const { forumId } = req.params;
  const { subject } = req.query;
  
  // Get forum members
  const ForumMember = require("../models/ForumMember");
  const User = require("../models/User");
  
  const forumMembers = await ForumMember.find({
    forumId,
    status: 'approved'
  }).populate('userId', 'firstName lastName avatar educationLevel targetExam');
  
  // Filter and rank potential study partners
  const partners = forumMembers
    .filter(member => member.userId._id.toString() !== req.user.id.toString())
    .map(member => {
      const user = member.userId;
      let matchScore = 0;
      
      // Calculate match score based on common interests
      if (subject && user.targetExam) {
        if (user.targetExam === subject.toLowerCase()) matchScore += 30;
      }
      
      if (user.educationLevel) matchScore += 20;
      
      // Add random score for variety
      matchScore += Math.random() * 20;
      
      return {
        userId: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        expertise: [user.targetExam || 'general'],
        availability: ['morning', 'evening'], // Placeholder
        matchScore: Math.round(matchScore)
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 10);
  
  res.status(200).json({
    success: true,
    data: partners
  });
});

module.exports = exports; 