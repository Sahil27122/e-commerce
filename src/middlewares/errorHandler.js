const errorHandler = (err, req, res, next) => {
    
    const statusCode = err.statusCode || 500

    if(process.env.NODE_ENV == 'development'){
        return res.status(statusCode).json({
            success: false,
            message: err.message,
            stack: err.stack // exact line where error occurred
        })
    }

    res.status(statusCode).json({
        sucess: false,
        message: err.isOperational ? err.message : 'Something went wrong'
    })
}

module.exports = errorHandler