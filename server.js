require('dotenv').config()

const app = require('./src/app')

const connectMongoDB = require('./src/config/mongoose')

const PORT = process.env.PORT || 3000

connectMongoDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`)
    })
})
.catch((err) => {
    console.error('MongoDB connection failed:', err.message)
    process.exit(1)  // kill the process - don't start a broken server
})
