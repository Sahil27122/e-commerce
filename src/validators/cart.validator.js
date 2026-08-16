const {z} = require('zod')

const addToCartSchema = z.object({
    productId: z.string().length(24, 'Invalid product ID'),
    quantity: z.coerce.number().int().min(1).max(20)
})

module.exports = { addToCartSchema }
