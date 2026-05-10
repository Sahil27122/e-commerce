const Product = require('../models/product.model')
const AppError = require('../utils/AppError')

const slugify = require('../utils/slugify')

const cloudinary = require('../config/cloudinary')

const createProduct = async (productData) => {

    // generate slug for product
    productData.slug = slugify(productData.name)

    const { name, description, price, quantity, images, category, slug, attributes } = productData

    const product = await Product.create({
        name,
        description,
        price,
        quantity,
        images,
        category,
        slug,
        attributes
    })

    return product
}

const getProducts = async (filters) => {

    const { category, search, minPrice, maxPrice, page = 1, limit = 10 } = filters

    // build query object dynamically
    const query = { isActive: true }

    if(category){
        query.category = category
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

module.exports = { createProduct, getProducts, getProductBySlug, updateProduct, deleteProduct, uploadProductImage }