const asyncHandler = require('../utils/asyncHandler') 

const AppError = require('../utils/AppError')

const cartService = require('../services/cart.service');

const addToCart = asyncHandler( async(req, res) => {
    const {userId} = req.user;
    const {productId, quantity} = req.body;

    const cart = await cartService.addToCart(userId, productId, quantity);

    res.status(200).json({
        success: true,
        data: cart
    })
})

const getCart = asyncHandler( async(req, res) => {
    const {userId} = req.user;

    const cart = await cartService.getCart(userId);

    res.status(200).json({
        success: true,
        data: cart
    })
})

const removeItem = asyncHandler( async(req, res) => {
    const {userId} = req.user
    const productId = req.params.id

    const cart = await cartService.removeItem(userId, productId)


    res.status(200).json({
        success: true,
        data: cart
    })
})

const clearCart = asyncHandler( async(req, res) => {
    const {userId} = req.user

    const cart = await cartService.clearCart(userId)

    res.status(200).json({
        success: true,
        data: cart
    })
})

module.exports = { addToCart, getCart, removeItem, clearCart }