const Course = require("../models/Course");
const Category = require("../models/Category");
const { catchAsync } = require("../middleware/errorHandler");

const staticCategories = [
  {
    id: "pre-engineering",
    name: "Pre-Engineering",
    icon: "🔧",
    description: "Engineering preparation courses for FSc students",
    classOptions: ["9", "10", "11", "12"],
    courseCount: 0,
  },
  {
    id: "pre-medical",
    name: "Pre-Medical",
    icon: "🏥",
    description: "Medical preparation courses for FSc students",
    classOptions: ["9", "10", "11", "12"],
    courseCount: 0,
  },
  {
    id: "computer-science",
    name: "Computer Science",
    icon: "💻",
    description: "Computer science and programming courses",
    classOptions: ["9", "10", "11", "12"],
    courseCount: 0,
  },
  {
    id: "bba",
    name: "BBA",
    icon: "💼",
    description: "Business administration and management courses",
    classOptions: ["9", "10", "11", "12"],
    courseCount: 0,
  },
  {
    id: "o-levels",
    name: "O Levels",
    icon: "📚",
    description: "O Level preparation courses",
    classOptions: ["o-level"],
    courseCount: 0,
  },
  {
    id: "a-levels",
    name: "A Levels",
    icon: "🎓",
    description: "A Level preparation courses",
    classOptions: ["a-level"],
    courseCount: 0,
  },
];

// Get all categories
exports.getCategories = catchAsync(async (req, res) => {
  const categoryDocs = await Category.find({ isActive: true }).sort({
    name: 1,
  });
  const categoriesToReturn =
    categoryDocs.length > 0 ? categoryDocs : staticCategories;

  for (let category of categoriesToReturn) {
    const count = await Course.countDocuments({
      category: category.id || category.slug,
      isPublished: true,
    });
    category.courseCount = count;
  }

  res.status(200).json({
    success: true,
    data: categoriesToReturn,
  });
});

// Get classes for a specific category
exports.getClassesByCategory = catchAsync(async (req, res) => {
  const { categoryId } = req.params;

  const databaseCategory = await Category.findOne({
    slug: categoryId,
    isActive: true,
  });

  if (databaseCategory) {
    const classes = databaseCategory.classes.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      courseCount: 0,
    }));

    for (let classItem of classes) {
      const count = await Course.countDocuments({
        category: categoryId,
        class: classItem.id,
        isPublished: true,
      });
      classItem.courseCount = count;
    }

    return res.status(200).json({
      success: true,
      data: {
        name: databaseCategory.name,
        icon: databaseCategory.icon,
        description: databaseCategory.description,
        classes,
      },
    });
  }

  const category = {
    "pre-engineering": {
      name: "Pre-Engineering",
      classes: [
        {
          id: "9",
          name: "Class 9",
          description: "9th grade engineering preparation",
        },
        {
          id: "10",
          name: "Class 10",
          description: "10th grade engineering preparation",
        },
        {
          id: "11",
          name: "Class 11",
          description: "11th grade engineering preparation",
        },
        {
          id: "12",
          name: "Class 12",
          description: "12th grade engineering preparation",
        },
      ],
    },
    "pre-medical": {
      name: "Pre-Medical",
      classes: [
        {
          id: "9",
          name: "Class 9",
          description: "9th grade medical preparation",
        },
        {
          id: "10",
          name: "Class 10",
          description: "10th grade medical preparation",
        },
        {
          id: "11",
          name: "Class 11",
          description: "11th grade medical preparation",
        },
        {
          id: "12",
          name: "Class 12",
          description: "12th grade medical preparation",
        },
      ],
    },
    "computer-science": {
      name: "Computer Science",
      classes: [
        { id: "9", name: "Class 9", description: "9th grade computer science" },
        {
          id: "10",
          name: "Class 10",
          description: "10th grade computer science",
        },
        {
          id: "11",
          name: "Class 11",
          description: "11th grade computer science",
        },
        {
          id: "12",
          name: "Class 12",
          description: "12th grade computer science",
        },
      ],
    },
    bba: {
      name: "BBA",
      classes: [
        {
          id: "9",
          name: "Class 9",
          description: "9th grade business administration",
        },
        {
          id: "10",
          name: "Class 10",
          description: "10th grade business administration",
        },
        {
          id: "11",
          name: "Class 11",
          description: "11th grade business administration",
        },
        {
          id: "12",
          name: "Class 12",
          description: "12th grade business administration",
        },
      ],
    },
    "o-levels": {
      name: "O Levels",
      classes: [
        {
          id: "o-level",
          name: "O Level",
          description: "O Level preparation courses",
        },
      ],
    },
    "a-levels": {
      name: "A Levels",
      classes: [
        {
          id: "a-level",
          name: "A Level",
          description: "A Level preparation courses",
        },
      ],
    },
  };

  if (!category[categoryId]) {
    return res.status(404).json({
      success: false,
      error: "Category not found",
    });
  }

  // Get course counts for each class
  for (let classItem of category[categoryId].classes) {
    const count = await Course.countDocuments({
      category: categoryId,
      class: classItem.id,
      isPublished: true,
    });
    classItem.courseCount = count;
  }

  res.status(200).json({
    success: true,
    data: category[categoryId],
  });
});

// Get courses by category and class
exports.getCoursesByCategoryAndClass = catchAsync(async (req, res) => {
  const { categoryId, classId } = req.params;
  const { page = 1, limit = 10, search } = req.query;

  const filter = {
    category: categoryId,
    class: classId,
    isPublished: true,
  };

  // Add search filter if provided
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { instructorName: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (page - 1) * limit;

  const courses = await Course.find(filter)
    .select(
      "title shortDescription instructorName thumbnail rating totalStudents price level",
    )
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

  const total = await Course.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: courses,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  });
});
