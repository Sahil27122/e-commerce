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
        type: String,
        required: true
    },
    attributes: {
        type: mongoose.Schema.Types.Mixed  // accepts any structure
    },
    isActive: {
        type: Boolean,
        default: true
    }

}, {timestamps: true})

productSchema.pre('save', async function() {
    if (this.isModified('name')) {
        this.slug = this.name
            .toLowerCase()
            .trim()                     // remove leading/trailing spaces first
            .replace(/\s+/g, '-')       // one or more spaces -> single hyphen
            .replace(/[^\w-]+/g, '')    // remove special characters
            .replace(/--+/g, '-')       // multiple hyphens -> single hyphen
            .replace(/^-+|-+$/g, '')    // remove leading/trailing hyphens
    }
})

const Product = mongoose.model('Product', productSchema)

module.exports = Product