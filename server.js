// Load environment variables
require('dotenv').config()

// Import app
const app = require('./src/app')

const PORT = process.env.PORT || 30000

// Start listening a PORT from .env
app.listen(PORT, () => {
    // callback runs when server is ready
    console.log(`Server running on port ${PORT}`)
})
