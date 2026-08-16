const express = require('express');
const router = express.Router()

const cartController = require('../controllers/cart.controller')

const validate = require('../middlewares/validate')
const { addToCartSchema } = require('../validators/cart.validator')

const {protect} = require('../middlewares/auth.middleware')

router.post('/add', protect, validate(addToCartSchema), cartController.addToCart)

router.get('/', protect, cartController.getCart)

router.delete('/items/:id', protect, cartController.removeItem)

router.delete('/', protect, cartController.clearCart)

module.exports = router