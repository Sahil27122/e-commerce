// Create express app
const express = require('express')

const app = express();

// Add Json middleware (so we can read request bodies)
app.use(express.json())

app.get('/health' , (req, res) => {
    res.json({status: 'ok', message: 'Server is running'})
})

// Export the app
module.exports = app