const Product = require('../models/product.model')
const AppError = require('../utils/AppError')

const slugify = require('../utils/slugify')

const cloudinary = require('../config/cloudinary')

const Category = require('../models/category.model')

const mongoose = require('mongoose')

const buildCategoryChain = async (categoryId) => {
    const chain = []
    let current = await Category.findById(categoryId)

    while (current) {
        
        chain.push(current._id)

        if(!current.parent){
            break;
        }else{
            current = await Category.findById(current.parent)
        }

    }

    return chain
}

const createProduct = async (productData) => {

    // generate slug for product
    productData.slug = slugify(productData.name)

    // build category path
    const categoryPath = await buildCategoryChain(productData.category)

    const { name, description, price, quantity, images, category, slug, attributes } = productData

    const product = await Product.create({
        name,
        description,
        price,
        quantity,
        images,
        category,
        categoryPath,
        slug,
        attributes
    })

    return product
}

const getProducts = async (filters) => {

    const { category, search, attributeKey, attributeValue, minPrice, maxPrice, page = 1, limit = 10 } = filters

    // build query object dynamically
    const query = { isActive: true }

    if (category) {
        query.categoryPath = { 
            $in: [new mongoose.Types.ObjectId(category)] 
        }
    }

    if (search) {
        query.name = { $regex: search, $options: 'i' }
    }

    if(minPrice || maxPrice){
        query.price = {}

        if(minPrice){
            query.price.$gte = Number(minPrice)
        }

        if(maxPrice){
            query.price.$lte = Number(maxPrice)
        }
    }

    if (attributeKey && attributeValue) {
        query.attributes = {
            $elemMatch: {
                key: attributeKey,
                value: attributeValue
            }
        }
    }

    const skip = (page - 1) * limit

    const [products, total] = await Promise.all([
        Product.find(query).populate('category', 'name slug').skip(skip).limit(Number(limit)),
        Product.countDocuments(query)
    ])


    return {
        products,
        pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages: Math.ceil(total / limit)
        }
    }
}

const getProductFilters = async (filters) => {

    const { category } = filters

    if (!category) {
        throw new AppError('Category is required', 400)
    }

    const matchStage = { isActive: true }

    if(category){
        matchStage.categoryPath = { 
            $in: [new mongoose.Types.ObjectId(category)] 
        }
    }

    const result = await Product.aggregate([

        { $match: matchStage },

        { $unwind: '$attributes' },

        {
            $group: {
                _id: '$attributes.key',
                values: { $addToSet: '$attributes.value' }
            }
        },

        {
            $project: {
                _id: 0,
                key: '$_id',
                values: 1
            }
        },

        { $sort: {key: 1} }

    ])

    return result

}

const getProductBySlug = async (slug) => {

    const product = await Product.findOne({ slug }).populate('category', 'name slug')

    if(!product){
        throw new AppError('Product not found', 404)
    }

    return product
}

const updateProduct = async (id, updateData) => {

    // if name is being updated, regenerate slug
    if (updateData.name) {
        updateData.slug = slugify(updateData.name)
    }
    
    const product = await Product.findByIdAndUpdate(
        id,
        updateData,
        {new: true} 
        // returns updated document, not original
    )

    if(!product){
        throw new AppError('Product not found', 404)
    }

    return product
}

const deleteProduct = async (id) => {

    const product = await Product.findByIdAndUpdate(
        id,
        { isActive: false }  // soft delete
    )

    if(!product){
        throw new AppError('Product not found', 404)
    }
}

const uploadProductImage = async(id, fileBuffer, mimetype) => {
    
    const product = await Product.findById(id)

    if(!product){
        throw new AppError('Product not found', 404)
    }

    const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
            {folder: 'ecommerce/products'},
            (error, result) => {
                if(error){
                    reject(error)
                }else{
                    resolve(result)
                }
            }
        ).end(fileBuffer)
    })

    product.images.push(result.secure_url)
    await product.save()

    return product
}

module.exports = { createProduct, getProducts, getProductFilters, getProductBySlug, updateProduct, deleteProduct, uploadProductImage }