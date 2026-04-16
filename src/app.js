// Create express app
const express = require('express')

const authRoutes = require('./routes/auth.routes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// Add Json middleware (so we can read request bodies)
app.use(express.json())

app.get('/health' , (req, res) => {
    res.json({status: 'ok', message: 'Server is running'})
})

app.use('/auth', authRoutes)

app.use(errorHandler)

// Export the app
module.exports = app