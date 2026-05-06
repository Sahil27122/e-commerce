const Product = require('../models/product.model')

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

module.exports = { createProduct }