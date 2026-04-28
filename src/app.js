const express = require('express')

const cookieParser = require('cookie-parser')

const authRoutes = require('./routes/auth.routes');

const errorHandler = require('./middlewares/errorHandler');

const app = express();

// Add Json middleware (so we can read request bodies)
app.use(express.json())

app.use(cookieParser())

app.get('/health' , (req, res) => {
    res.json({status: 'ok', message: 'Server is running'})
})

app.use('/auth', authRoutes)

app.use(errorHandler) // after all routes

module.exports = app