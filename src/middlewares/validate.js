const AppError = require('../utils/AppError')

const validate = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body)

    if(!result.success){
        const errors = result.error.issues.map(e => e.message)
        return next(new AppError(errors[0], 400))
    }

    req.body = result.data
    next()
}

module.exports = validate