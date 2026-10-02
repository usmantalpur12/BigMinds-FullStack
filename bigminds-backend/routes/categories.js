const express = require('express');
const categoryController = require('../controllers/categoryController');

const router = express.Router();

// Get all categories
router.get('/', categoryController.getCategories);

// Get classes for a specific category
router.get('/:categoryId/classes', categoryController.getClassesByCategory);

// Get courses for a specific category and class
router.get('/:categoryId/classes/:classId/courses', categoryController.getCoursesByCategoryAndClass);

module.exports = router; 