const Product = require('../models/product.model')
const AppError = require('../utils/AppError')

const createProduct = async (productData) => {

    const { name, description, price, quantity, images, category, attributes } = productData

    const product = await new Product({
        name,
        description,
        price,
        quantity,
        images,
        category,
        attributes
    }).save()

    return product
}

const getProducts = async (filters) => {

    const { category, minPrice, maxPrice, page = 1, limit = 10 } = filters

    // build query object dynamically
    const query = { isActive: true }

    if(category){
        query.category = category
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

    const skip = (page - 1) * limit

    const [products, total] = await Promise.all([
        Product.find(query).skip(skip).limit(Number(limit)),
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

const getProductBySlug = async (slug) => {

    const product = await Product.findOne({
        slug
    })

    if(!product){
        throw new AppError('Product not found', 404)
    }

    return product
}

const updateProduct = async (id, updateData) => {
    
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

module.exports = { createProduct, getProducts, getProductBySlug, updateProduct, deleteProduct }