const asyncHandler = require('../utils/asyncHandler') 

const productService = require('../services/product.service')

const AppError = require('../utils/AppError')

const createProduct = asyncHandler( async(req, res) => {
    
    const productData = req.body

    const result = await productService.createProduct(productData)

    res.status(201).json({
        success: true,
        data: result
    })
})

const getProducts = asyncHandler( async(req, res) => {

    const filters = req.query

    const result = await productService.getProducts(filters)

    res.status(200).json({
        success: true,
        data: result
    })
    
})

const getProductFilters = asyncHandler( async(req, res) => {

    const filters = req.query

    const result = await productService.getProductFilters(filters)

    res.status(200).json({
        success: true,
        data: result
    })
})

const getProductBySlug = asyncHandler( async(req, res) => {
    
    const slug = req.params.slug

    const result = await productService.getProductBySlug(slug)

    res.status(200).json({
        success: true,
        data: result
    })
    
})

const updateProduct = asyncHandler( async(req, res) => {

    const id = req.params.id

    const updateData = req.body

    const result = await productService.updateProduct(id, updateData)

    res.status(200).json({
        success: true,
        data: result
    })

})

const deleteProduct = asyncHandler( async(req, res) => {

    const id = req.params.id

    await productService.deleteProduct(id)

    res.status(200).json({
        success: true,
        message: 'Product deleted successfully'
    })
})

const uploadProductImage = asyncHandler( async(req, res) => {

    // req.file comes from multer middleware
    if(!req.file){
        throw new AppError('No image provided', 400)
    }

    const result = await productService.uploadProductImage(
        req.params.id,
        req.file.buffer,
        req.file.mimetype
    )

    res.status(200).json({
        success: true,
        data: result
    })
})

module.exports = { createProduct, getProducts, getProductFilters, getProductBySlug, updateProduct, deleteProduct, uploadProductImage }