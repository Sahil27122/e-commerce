const Category = require('../models/category.model')

const Product = require('../models/product.model')

const AppError = require('../utils/AppError')

const slugify = require('../utils/slugify')

const cloudinary = require('../config/cloudinary')

const { invalidateCache } = require('../utils/cache')

const createCategory = async (categoryData) => {

    categoryData.slug = slugify(categoryData.name)

    const { name, slug, description, parent, image } = categoryData

    const category = await Category.create({
        name, 
        slug, 
        description, 
        parent, 
        image
    })

    await invalidateCache('cache:/categories')
    await invalidateCache('cache:/products')

    return category
}

const getCategories = async (filters) => {

    const query = { isActive: true }
    
    if (filters.parent === 'null'){
        query.parent = null           // top-level only
    } else if (filters.parent){
        query.parent = filters.parent // subcategories of specific parent
    }
    
    const categories = await Category.find(query).populate('parent', 'name slug')

    return categories
}

const getCategoryBySlug = async (slug) => {

    const category = await Category.findOne({slug}).populate('parent', 'name slug')

    if(!category){
        throw new AppError('Category not found', 404)
    }

    return category
}


const updateCategory = async (id, updateData) => {

    if(updateData.name){
        updateData.slug = slugify(updateData.name)
    }

    const category = await Category.findByIdAndUpdate(
        id,
        updateData,
        {new: true}
    )

    if(!category){
        throw new AppError('Category not found', 404)
    }

    await invalidateCache('cache:/categories')
    await invalidateCache('cache:/products')

    return category
}

const deleteCategory = async (id) => {

    const productCount = await Product.countDocuments({
        category: id,
        isActive: true
    })
    
    if(productCount > 0){
        throw new AppError('Cannot delete category with active products', 400)
    }
    
    const category = await Category.findByIdAndUpdate(
        id,
        { isActive: false}
    )
    
    if(!category){
        throw new AppError('Category not found', 404)
    }

    await invalidateCache('cache:/categories')
    await invalidateCache('cache:/products')
}

const uploadCategoryImage = async (id, fileBuffer, memetype) => {

    const category = await Category.findById(id)

    if(!category){
        throw new AppError('Category not found', 404)
    }

    const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
            {folder: 'ecommerce/categories'},
            (error, result) => {
                if(error){
                    reject(error)
                }else{
                    resolve(result)
                }
            }
        ).end(fileBuffer)
    })

    category.image = result.secure_url
    await category.save()

    await invalidateCache('cache:/categories')
    await invalidateCache('cache:/products')

    return category
}

module.exports = { createCategory, getCategories, getCategoryBySlug, updateCategory, deleteCategory, uploadCategoryImage }