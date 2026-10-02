const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../server");
const User = require("../models/User");
const UserDocument = require("../models/UserDocument");
const ActivityLog = require("../models/ActivityLog");

describe("Profile API", () => {
  let studentToken;
  let teacherToken;
  let studentId;
  let teacherId;

  beforeAll(async () => {
    // Create test student
    const student = await User.create({
      firstName: "Test",
      lastName: "Student",
      email: "student@test.com",
      password: "Test123456",
      role: "student",
      city: "Lahore",
    });

    studentId = student._id;
    studentToken = student.generateAuthToken();

    // Create test teacher
    const teacher = await User.create({
      firstName: "Test",
      lastName: "Teacher",
      email: "teacher@test.com",
      password: "Test123456",
      role: "teacher",
      city: "Lahore",
    });

    teacherId = teacher._id;
    teacherToken = teacher.generateAuthToken();
  });

  afterAll(async () => {
    await User.deleteMany({});
    await UserDocument.deleteMany({});
    await ActivityLog.deleteMany({});
    await mongoose.connection.close();
  });

  describe("GET /api/profile/me", () => {
    it("should get student profile", async () => {
      const res = await request(app)
        .get("/api/profile/me")
        .set("Authorization", `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("_id");
      expect(res.body.data.role).toBe("student");
    });

    it("should get teacher profile", async () => {
      const res = await request(app)
        .get("/api/profile/me")
        .set("Authorization", `Bearer ${teacherToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.role).toBe("teacher");
    });

    it("should require authentication", async () => {
      const res = await request(app).get("/api/profile/me");

      expect(res.status).toBe(401);
    });
  });

  describe("PUT /api/profile/update", () => {
    it("should update profile fields", async () => {
      const res = await request(app)
        .put("/api/profile/update")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          displayName: "Test Student",
          bio: "I am a test student",
          location: "Lahore, Pakistan",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.displayName).toBe("Test Student");
      expect(res.body.data.bio).toBe("I am a test student");
    });

    it("should validate input", async () => {
      const res = await request(app)
        .put("/api/profile/update")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          displayName: "A", // Too short
        });

      expect(res.status).toBe(400);
    });
  });

  describe("PUT /api/profile/student/update", () => {
    it("should update student profile fields", async () => {
      const res = await request(app)
        .put("/api/profile/student/update")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          classLevel: "11",
          category: "pre-engineering",
          learningGoals: "I want to become an engineer",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.studentProfile.classLevel).toBe("11");
      expect(res.body.data.studentProfile.category).toBe("pre-engineering");
    });

    it("should reject teacher from updating student fields", async () => {
      const res = await request(app)
        .put("/api/profile/student/update")
        .set("Authorization", `Bearer ${teacherToken}`)
        .send({
          classLevel: "11",
        });

      expect(res.status).toBe(403);
    });
  });

  describe("PUT /api/profile/teacher/update", () => {
    it("should update teacher profile fields", async () => {
      const res = await request(app)
        .put("/api/profile/teacher/update")
        .set("Authorization", `Bearer ${teacherToken}`)
        .send({
          qualification: "M.Sc. Computer Science",
          experienceYears: 5,
          subjects: ["Mathematics", "Physics"],
          expertiseTags: ["Programming", "Algorithms"],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.teacherProfile.qualification).toBe("M.Sc. Computer Science");
      expect(res.body.data.teacherProfile.experienceYears).toBe(5);
    });

    it("should reject student from updating teacher fields", async () => {
      const res = await request(app)
        .put("/api/profile/teacher/update")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          qualification: "M.Sc.",
        });

      expect(res.status).toBe(403);
    });
  });

  describe("PUT /api/profile/password", () => {
    it("should change password with correct current password", async () => {
      const res = await request(app)
        .put("/api/profile/password")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          currentPassword: "Test123456",
          newPassword: "NewPassword123",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should reject password change with incorrect current password", async () => {
      const res = await request(app)
        .put("/api/profile/password")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          currentPassword: "WrongPassword",
          newPassword: "NewPassword123",
        });

      expect(res.status).toBe(400);
    });

    it("should validate password strength", async () => {
      const res = await request(app)
        .put("/api/profile/password")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          currentPassword: "Test123456",
          newPassword: "weak", // Too weak
        });

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/profile/activity", () => {
    it("should get activity logs", async () => {
      // Create some activity logs first
      await ActivityLog.create({
        userId: studentId,
        action: "profile_updated",
        meta: { fields: ["displayName"] },
        ip: "127.0.0.1",
      });

      const res = await request(app)
        .get("/api/profile/activity")
        .set("Authorization", `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe("PUT /api/profile/security", () => {
    it("should update two-factor authentication setting", async () => {
      const res = await request(app)
        .put("/api/profile/security")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
          twoFactorEnabled: true,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.twoFactorEnabled).toBe(true);
    });
  });
});

