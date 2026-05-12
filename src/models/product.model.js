const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    slug: {
        type: String,
        unique: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
        default: 0
    },
    images: {
        type: [String]
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    categoryPath: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    }],
    attributes: [{
        key: {
            type: String,
            required: true
        },
        value: {
            type: mongoose.Schema.Types.Mixed,
            required: true
        },
        _id: false
    }],
    isActive: {
        type: Boolean,
        default: true
    }

}, { timestamps: true })

productSchema.index({ 'attributes.key': 1, 'attributes.value': 1 })
productSchema.index({ isActive: 1, categoryPath: 1, price: 1 })
productSchema.index({ isActive: 1, price: 1 })

const Product = mongoose.model('Product', productSchema)

module.exports = Product