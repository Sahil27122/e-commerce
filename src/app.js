const express = require('express')

const cookieParser = require('cookie-parser')

const authRoutes = require('./routes/auth.routes');

const productRoutes = require('./routes/product.routes')

const categoryRoutes = require('./routes/category.routes')

const cartRoutes = require('./routes/cart.routes')

const addressRoutes = require('./routes/address.routes')

const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(express.json())

app.use(cookieParser())

app.get('/health' , (req, res) => {
    res.json({status: 'ok', message: 'Server is running'})
})

app.use('/auth', authRoutes)
app.use('/products', productRoutes)
app.use('/categories', categoryRoutes)
app.use('/cart', cartRoutes)
app.use('/addresses', addressRoutes)

app.use(errorHandler) // after all routes

module.exports = app