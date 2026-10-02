## Teacher Flow Screens

Each entry lists the Expo Router import path that currently renders a teacher-facing screen. Keep Student-facing routes untouched.

- `BigMindsEducation/app/teacher/index.tsx` – `import TeacherDashboard from "../app/teacher";`
- `BigMindsEducation/app/teacher/my-courses.tsx` – `import MyCoursesScreen from "../app/teacher/my-courses";`
- `BigMindsEducation/app/teacher/create-course.tsx` – `import CreateCourseScreen from "../app/teacher/create-course";`
- `BigMindsEducation/app/teacher/create-forum.tsx` – `import CreateForumScreen from "../app/teacher/create-forum";`
- `BigMindsEducation/app/teacher/create-quiz.tsx` – `import CreateQuizScreen from "../app/teacher/create-quiz";`
- `BigMindsEducation/app/teacher/earnings.tsx` – `import EarningsScreen from "../app/teacher/earnings";`
- `BigMindsEducation/app/teacher/my-forums.tsx` – `import MyForumsScreen from "../app/teacher/my-forums";`
- `BigMindsEducation/app/teacher/profile.tsx` – `import TeacherProfileScreen from "../app/teacher/profile";`
- `BigMindsEducation/app/teacher/_layout.tsx` – `import TeacherStack from "../app/teacher/_layout";` (stack wrapper)
- `BigMindsEducation/app/teacher-dashboard.tsx` – `import TeacherDashboardLegacy from "../app/teacher-dashboard";`

### Teacher Navigation Tree

```
Teacher Dashboard
├─ Course List (My Courses)
│  └─ Course View (Course Detail via `/course-detail/[courseId]`)
├─ Course Upload (Create Course)
│  └─ Course Form (shared create/edit)
├─ Course View (entry point from dashboard and list)
├─ Profile
│  ├─ Edit Profile subsections (change password, payouts, etc.)
│  └─ Switch To Student Mode
└─ Auxiliary Screens
   ├─ My Forums → Forum Detail
   ├─ Create Forum
   ├─ Create Quiz
   └─ Earnings
```

