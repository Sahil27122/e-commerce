const { redisClient } = require('../config/redis')

const { acquireLock, releaseLock } = require('../utils/cache')

const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms))
}

const cacheMiddleware = (ttl) => {
    return async (req, res, next) => {

        const key = `cache:${req.originalUrl}`
        const lockKey = `lock:${req.originalUrl}`

        try {
            // Check cache
            const cachedData = await redisClient.get(key)

            if (cachedData) {
                return res.status(200).json(JSON.parse(cachedData))
            }

            // Try to acquire lock
            const token = await acquireLock(lockKey, 10)


            // We didn't get the lock
            if (!token) {

                for (let attempt = 0; attempt < 10; attempt++) {

                    await sleep(50)

                    const cachedAgain = await redisClient.get(key)

                    if (cachedAgain) {
                        return res.json(JSON.parse(cachedAgain))
                    }
                }

                // Cache still unavailable.
                // Let this request continue normally.
                return next()
            }

            // We got the lock
            const originalJson = res.json.bind(res)

            res.json = async (data) => {
                 try {
                    if (data && data.success === true) {
                        await redisClient.setEx(
                            key,
                            ttl,
                            JSON.stringify(data)
                        )
                    }
                } catch (err) {
                   console.error('Cache write failed:', err.message)
                } finally {
                    await releaseLock(lockKey, token)
                }

                return originalJson(data)
            }

            next()

        } catch (error) {
            next(error)
        }
    }
}

module.exports = cacheMiddleware