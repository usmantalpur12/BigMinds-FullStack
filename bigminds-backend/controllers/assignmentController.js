const { catchAsync } = require("../middleware/errorHandler");
const Assignment = require("../models/Assignment");
const AssignmentSubmission = require("../models/AssignmentSubmission");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");

// Get all assignments for a course
exports.getCourseAssignments = catchAsync(async (req, res) => {
  const { courseId } = req.params;
  const { status } = req.query;

  let query = { courseId, isPublished: true };

  if (status) {
    const now = new Date();
    if (status === "open") {
      query.dueDate = { $gte: now };
    } else if (status === "closed") {
      query.dueDate = { $lt: now };
    }
  }

  const assignments = await Assignment.find(query)
    .populate("createdBy", "firstName lastName")
    .sort({ dueDate: 1 });

  // Add submission status if user is student
  if (req.user && req.user.role === "student") {
    const submissions = await AssignmentSubmission.find({
      assignmentId: { $in: assignments.map(a => a._id) },
      studentId: req.user.id,
    });

    const submissionMap = {};
    submissions.forEach(s => {
      submissionMap[s.assignmentId.toString()] = s;
    });

    const assignmentsWithStatus = assignments.map(assignment => {
      const submission = submissionMap[assignment._id.toString()];
      return {
        ...assignment.toObject(),
        hasSubmitted: !!submission,
        submission: submission || null,
      };
    });

    return res.status(200).json({
      success: true,
      data: assignmentsWithStatus,
    });
  }

  res.status(200).json({
    success: true,
    data: assignments,
  });
});

// Get single assignment
exports.getAssignment = catchAsync(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id)
    .populate("createdBy", "firstName lastName avatar")
    .populate("courseId", "title");

  if (!assignment) {
    return res.status(404).json({
      success: false,
      message: "Assignment not found",
    });
  }

  // Add submission if user is student
  if (req.user && req.user.role === "student") {
    const submission = await AssignmentSubmission.findOne({
      assignmentId: req.params.id,
      studentId: req.user.id,
    });

    return res.status(200).json({
      success: true,
      data: {
        ...assignment.toObject(),
        submission: submission || null,
      },
    });
  }

  res.status(200).json({
    success: true,
    data: assignment,
  });
});

// Create assignment (Teacher/Admin only)
exports.createAssignment = catchAsync(async (req, res) => {
  const { courseId } = req.params;

  // Check if course exists and user is instructor
  const course = await Course.findById(courseId);
  if (!course) {
    return res.status(404).json({
      success: false,
      message: "Course not found",
    });
  }

  if (course.instructor.toString() !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Not authorized to create assignments for this course",
    });
  }

  const assignment = await Assignment.create({
    ...req.body,
    courseId,
    createdBy: req.user.id,
  });

  await assignment.populate("createdBy", "firstName lastName");

  res.status(201).json({
    success: true,
    data: assignment,
    message: "Assignment created successfully",
  });
});

// Update assignment (Teacher/Admin only)
exports.updateAssignment = catchAsync(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);

  if (!assignment) {
    return res.status(404).json({
      success: false,
      message: "Assignment not found",
    });
  }

  // Check authorization
  const course = await Course.findById(assignment.courseId);
  if (course.instructor.toString() !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Not authorized to update this assignment",
    });
  }

  const updatedAssignment = await Assignment.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate("createdBy", "firstName lastName");

  res.status(200).json({
    success: true,
    data: updatedAssignment,
    message: "Assignment updated successfully",
  });
});

// Delete assignment (Teacher/Admin only)
exports.deleteAssignment = catchAsync(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);

  if (!assignment) {
    return res.status(404).json({
      success: false,
      message: "Assignment not found",
    });
  }

  // Check authorization
  const course = await Course.findById(assignment.courseId);
  if (course.instructor.toString() !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Not authorized to delete this assignment",
    });
  }

  // Delete all submissions
  await AssignmentSubmission.deleteMany({ assignmentId: req.params.id });

  await assignment.deleteOne();

  res.status(200).json({
    success: true,
    message: "Assignment deleted successfully",
  });
});

// Submit assignment (Student only)
exports.submitAssignment = catchAsync(async (req, res) => {
  const { assignmentId } = req.params;

  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) {
    return res.status(404).json({
      success: false,
      message: "Assignment not found",
    });
  }

  // Check if student is enrolled
  const enrollment = await Enrollment.findOne({
    courseId: assignment.courseId,
    studentId: req.user.id,
  });

  if (!enrollment) {
    return res.status(403).json({
      success: false,
      message: "You must be enrolled in this course to submit assignments",
    });
  }

  // Check if already submitted
  const existingSubmission = await AssignmentSubmission.findOne({
    assignmentId,
    studentId: req.user.id,
  });

  if (existingSubmission) {
    return res.status(400).json({
      success: false,
      message: "Assignment already submitted. Use update endpoint to modify.",
    });
  }

  // Check if due date has passed
  const now = new Date();
  const isLate = assignment.dueDate < now;

  if (isLate && !assignment.allowLateSubmission) {
    return res.status(400).json({
      success: false,
      message: "Assignment submission deadline has passed",
    });
  }

  const submission = await AssignmentSubmission.create({
    assignmentId,
    courseId: assignment.courseId,
    studentId: req.user.id,
    submissionText: req.body.submissionText,
    attachments: req.body.attachments || [],
    isLate,
    maxScore: assignment.maxScore,
  });

  await submission.populate("studentId", "firstName lastName avatar");

  res.status(201).json({
    success: true,
    data: submission,
    message: "Assignment submitted successfully",
  });
});

// Update submission (Student only)
exports.updateSubmission = catchAsync(async (req, res) => {
  const submission = await AssignmentSubmission.findById(req.params.submissionId);

  if (!submission) {
    return res.status(404).json({
      success: false,
      message: "Submission not found",
    });
  }

  if (submission.studentId.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: "Not authorized to update this submission",
    });
  }

  if (submission.status === "graded") {
    return res.status(400).json({
      success: false,
      message: "Cannot update graded submission",
    });
  }

  const updatedSubmission = await AssignmentSubmission.findByIdAndUpdate(
    req.params.submissionId,
    {
      submissionText: req.body.submissionText,
      attachments: req.body.attachments || submission.attachments,
    },
    { new: true, runValidators: true }
  ).populate("studentId", "firstName lastName avatar");

  res.status(200).json({
    success: true,
    data: updatedSubmission,
    message: "Submission updated successfully",
  });
});

// Grade assignment (Teacher/Admin only)
exports.gradeAssignment = catchAsync(async (req, res) => {
  const { submissionId } = req.params;
  const { score, feedback } = req.body;

  const submission = await AssignmentSubmission.findById(submissionId)
    .populate("assignmentId");

  if (!submission) {
    return res.status(404).json({
      success: false,
      message: "Submission not found",
    });
  }

  // Check authorization
  const assignment = await Assignment.findById(submission.assignmentId);
  const course = await Course.findById(assignment.courseId);
  
  if (course.instructor.toString() !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Not authorized to grade this assignment",
    });
  }

  if (score < 0 || score > submission.maxScore) {
    return res.status(400).json({
      success: false,
      message: `Score must be between 0 and ${submission.maxScore}`,
    });
  }

  submission.score = score;
  submission.feedback = feedback;
  submission.gradedBy = req.user.id;
  submission.gradedAt = new Date();
  submission.status = "graded";

  await submission.save();

  await submission.populate("studentId", "firstName lastName avatar");
  await submission.populate("gradedBy", "firstName lastName");

  res.status(200).json({
    success: true,
    data: submission,
    message: "Assignment graded successfully",
  });
});

// Get all submissions for an assignment (Teacher/Admin only)
exports.getAssignmentSubmissions = catchAsync(async (req, res) => {
  const { assignmentId } = req.params;

  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) {
    return res.status(404).json({
      success: false,
      message: "Assignment not found",
    });
  }

  // Check authorization
  const course = await Course.findById(assignment.courseId);
  if (course.instructor.toString() !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Not authorized to view submissions",
    });
  }

  const submissions = await AssignmentSubmission.find({ assignmentId })
    .populate("studentId", "firstName lastName email avatar")
    .populate("gradedBy", "firstName lastName")
    .sort({ submittedAt: -1 });

  res.status(200).json({
    success: true,
    data: submissions,
    count: submissions.length,
  });
});

// Get student's submissions (Student only)
exports.getMySubmissions = catchAsync(async (req, res) => {
  const submissions = await AssignmentSubmission.find({ studentId: req.user.id })
    .populate("assignmentId", "title dueDate maxScore")
    .populate("courseId", "title")
    .sort({ submittedAt: -1 });

  res.status(200).json({
    success: true,
    data: submissions,
    count: submissions.length,
  });
});

