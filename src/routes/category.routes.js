const express = require('express')

const router = express.Router();

const {protect} = require('../middlewares/auth.middleware')

const { publicLimiter } = require('../middlewares/rateLimit')

const {authorize} = require('../middlewares/authorize')

const upload = require('../middlewares/upload')

const categoryController = require('../controllers/category.controller')

const cacheMiddleware = require('../middlewares/cache')

router.post('/', protect, authorize('ADMIN'), categoryController.createCategory)

router.get('/', publicLimiter, cacheMiddleware(600), categoryController.getCategories)

router.get('/:slug', publicLimiter, categoryController.getCategoryBySlug)

router.put('/:id', protect, authorize('ADMIN'), categoryController.updateCategory)

router.delete('/:id', protect, authorize('ADMIN'), categoryController.deleteCategory)

router.post('/:id/image', protect, authorize('ADMIN'), upload.single('image'), categoryController.uploadCategoryImage)

module.exports = router