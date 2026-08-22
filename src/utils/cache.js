const crypto = require('crypto')
const { redisClient } = require('../config/redis')

const acquireLock = async (key, ttl) => {

    const token = crypto.randomUUID()

    const result = await redisClient.set(
        key,
        token,
        {
            NX: true,
            EX: ttl
        }
    )

    if (result !== 'OK') {
        return null
    }

    return token
}

const releaseLock = async (key, token) => {

    const currentToken = await redisClient.get(key)

    if (currentToken === token) {
        await redisClient.del(key)
    }
}

const invalidateCache = async (prefix) => {
    try {
        let cursor = '0'

        do {
            const result = await redisClient.scan(cursor, {
                MATCH: prefix + '*',
                COUNT: 100
            })

            cursor = result.cursor

            if (result.keys.length > 0) {
                await redisClient.del(result.keys)
            }

        } while (cursor !== '0')

    } catch (err) {
        console.error('Cache invalidation failed:', err.message)
    }
}

module.exports = { acquireLock, releaseLock, invalidateCache }