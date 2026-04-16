const errorHandler = (err, req, res, next) => {
    // Default to 500 if no status code set
    const statusCode = err.statusCode || 500

    // Development - show full error
    if(process.env.NODE_ENV == 'development'){
        return res.status(statusCode).json({
            success: false,
            message: err.message,
            stack: err.stack // exact line where error occurred
        })
    }

    // Production — hide sensitive details
    res.status(statusCode).json({
        sucess: false,
        message: err.isOperational ? err.message : 'Something went wrong'
    })
}

module.exports = errorHandler