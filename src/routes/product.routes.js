const express = require('express')

const router = express.Router()

const { protect } = require('../middlewares/auth.middleware')

const { authorize } = require('../middlewares/authorize')

const productController = require('../controllers/product.controller')

router.post('/', protect, authorize('ADMIN'), productController.createProduct)

router.get('/', productController.getProducts)

router.get('/:slug', productController.getProductBySlug)

router.put('/:id', protect, authorize('ADMIN'), productController.updateProduct)

router.delete('/:id', protect, authorize('ADMIN'), productController.deleteProduct)

module.exports = router