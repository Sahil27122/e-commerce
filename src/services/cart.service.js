const Product = require('../models/product.model')
const AppError = require('../utils/AppError')

const { redisClient } = require('../config/redis')

const expire = 7 * 24 * 60 * 60

const addToCart = async(userId, productId, quantity) => {

    const product = await Product.findById(productId)

    if(!product || product.isActive === false){
        throw new AppError('Product not found', 404)
    }

    const key = "cart:" + userId

    await redisClient.hIncrBy(key, productId, quantity)

    await redisClient.expire(key, expire)

    const fields = await redisClient.hGetAll(key)

    const items = Object.entries(fields).map(([id, qty]) => ({
        productId: id,
        quantity: Number(qty)
    }))

    return { items }

}

const getCart = async(userId) => {

    const key = 'cart:' + userId;
    
    const fields = await redisClient.hGetAll(key)

    if(Object.keys(fields).length === 0) {
        return { items: [], total: 0 }
    }

    const ids = Object.keys(fields)

    const products = await Product.find({
        _id: { $in: ids},
        isActive: true
    })

    const productMap = {}
    for(const product of products){
        productMap[product._id.toString()] = product
    }

    const items = []
    let total = 0

    for(const [productId, qty] of Object.entries(fields)) {

        const product = productMap[productId]
        
        if(!product) {
            continue
        }

        const quantity = Number(qty)
        const lineTotal = product.price * quantity

        items.push({
            productId,
            name: product.name,
            price: product.price,
            quantity,
            lineTotal
        })

        total += lineTotal
    }
 
    return { items, total}
    
}

const removeItem = async(userId, productId) => {

    const key = "cart:" + userId;

    const deleted = await redisClient.hDel(key, productId)

    if(deleted === 0){
        throw new AppError('Item not in cart', 404)
    }

    const fields = await redisClient.hGetAll(key)

    if(Object.keys(fields).length === 0){
        await redisClient.del(key)
    }else{
        await redisClient.expire(key, expire)
    }

    return getCart(userId)

}

const clearCart = async(userId) => {

    const key = "cart:" + userId;

    await redisClient.del(key)

    return getCart(userId)
}

module.exports = { addToCart, getCart, removeItem, clearCart }
