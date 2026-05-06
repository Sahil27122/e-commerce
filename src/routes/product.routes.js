const express = require('express')

const router = express.Router()

const { protect } = require('../middlewares/auth.middleware')

const { authorize } = require('../middlewares/authorize')

const productController = require('../controllers/product.controller')

router.post('/', protect, authorize('ADMIN'), productController.createProduct)

module.exports = router