const jwt = require('jsonwebtoken')

const generateAccessToken = (userId, role) => {
    return jwt.sign(
        {userId, role},
        process.env.ACCESS_TOKEN_SECRET,
        {expiresIn: process.env.ACCESS_TOKEN_EXPIRY}
    )
}

const generateRefreshToken = (userId) => {
    return jwt.sign(
        {userId},
        process.env.REFRESH_TOKEN_SECRET,
        {expiresIn: process.env.REFRESH_TOKEN_EXPIRY}
    )
}

module.exports = {generateAccessToken, generateRefreshToken}