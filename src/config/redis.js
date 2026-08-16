const { createClient } = require('redis')

const redisClient = createClient()  

const connectRedis = async () => {
    await redisClient.connect()
    console.log('Redis connected')
}

module.exports = { redisClient, connectRedis }