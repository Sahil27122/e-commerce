const express = require('express');
const router = express.Router()

const cartController = require('../controllers/cart.controller')

const validate = require('../middlewares/validate')
const { addToCartSchema } = require('../validators/cart.validator')

const {protect} = require('../middlewares/auth.middleware')

const { cartLimiter } = require('../middlewares/rateLimit')

router.post('/add', protect, cartLimiter, validate(addToCartSchema), cartController.addToCart)

router.get('/', protect, cartLimiter, cartController.getCart)

router.delete('/items/:id', protect, cartLimiter, cartController.removeItem)

router.delete('/', protect, cartLimiter, cartController.clearCart)

module.exports = router