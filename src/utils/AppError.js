class AppError extends Error {
    constructor(message, statusCode){
        super(message) // <- parent Error runs here
                       // automatically sets this.stack
                       // automatically sets this.message
        this.statusCode = statusCode
        this.isOperational = true;
    }
}

module.exports = AppError