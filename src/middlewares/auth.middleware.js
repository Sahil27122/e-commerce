const jwt = require('jsonwebtoken')
const AppError = require('../utils/AppError')
const asyncHandler = require('../utils/asyncHandler')

const protect = asyncHandler(async (req, res, next) => {
   
    // header looks like: "Bearer eyJhbG..."
    const authHeader = req.headers.authorization

    if(!authHeader || !authHeader.startsWith('Bearer ')){
        throw new AppError('No token provided', 401)
    }

    const token = authHeader.split(' ')[1]

    // jwt.verify(token, secret) → returns payload or throws error
    // MATCH    -> returns decoded payload { userId, role }
    // NO MATCH -> throws JsonWebTokenError
    // EXPIRED  -> throws TokenExpiredError
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

    // Attach decoded payload to req.user
    req.user = decoded

    next()
})

module.exports = {protect}