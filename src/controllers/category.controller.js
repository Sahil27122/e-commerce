const asyncHandler = require('../utils/asyncHandler')

const categoryService = require('../services/category.service')

const AppError = require('../utils/AppError')

const createCategory = asyncHandler( async(req, res) => {

    const categoryData = req.body;

    const result = await categoryService.createCategory(categoryData)

    res.status(201).json({
        success: true,
        data: result
    })
    
})

const getCategories = asyncHandler( async(req, res) => {

    const filters = req.query

    const result = await categoryService.getCategories(filters);

    res.status(200).json({
        success: true,
        data: result
    })
})

const getCategoryBySlug = asyncHandler( async(req, res) => {

    const slug = req.params.slug

    const result = await categoryService.getCategoryBySlug(slug)

    res.status(200).json({
        success: true,
        data: result
    })
})

const updateCategory = asyncHandler( async(req, res) => {

    const id = req.params.id

    const updateData = req.body

    const result = await categoryService.updateCategory(id, updateData)

    res.status(200).json({
        success: true,
        data: result
    })
})

const deleteCategory = asyncHandler( async(req, res) => {

    const id = req.params.id

    const result = await categoryService.deleteCategory(id)

    res.status(200).json({
        success: true,
        message: 'Category deleted successfully'
    })
})

const uploadCategoryImage = asyncHandler( async(req, res) => {

    if(!req.file){
        throw new AppError('No image provided', 400)
    }

    const result = await categoryService.uploadCategoryImage(
        req.params.id,
        req.file.buffer,
        req.file.mimetype
    )

    res.status(200).json({
        success: true,
        data: result
    })
})

module.exports = { createCategory, getCategories, getCategoryBySlug, updateCategory, deleteCategory, uploadCategoryImage }