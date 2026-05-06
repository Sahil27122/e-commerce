const asyncHandler = require('../utils/asyncHandler') 

const productService = require('../services/product.service')

const createProduct = asyncHandler( async(req, res) => {
    
    const productData = req.body

    const result = await productService.createProduct(productData)

    res.status(201).json({
        success: true,
        data: result
    })
})

module.exports = { createProduct }