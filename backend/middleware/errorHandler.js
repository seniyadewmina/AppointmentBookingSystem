class AppError extends Error {
    constructor(message, statusCode) {
      super(message);
      this.statusCode = statusCode;
      this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
      this.isOperational = true;
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  const handleValidationError = (err) => {
    const errors = Object.values(err.errors).map(el => el.message);
    return new AppError(`Invalid input: ${errors.join('. ')}`, 400);
  };
  
  const globalErrorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
  
    let error = { ...err };
    error.message = err.message;
  
    // Handle specific error types
    if (error.name === 'SequelizeValidationError') handleValidationError(error);
  
    // Development logging
    if (process.env.NODE_ENV === 'development') {
      console.error('ERROR 💥', err);
      res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack
      });
    } else {
      // Production response
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    }
  };
  
  module.exports = { AppError, globalErrorHandler };