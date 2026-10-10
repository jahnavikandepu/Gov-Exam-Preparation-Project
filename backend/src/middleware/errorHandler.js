export const errorHandler = (err, req, res, next) => {
    console.error('Unhandled Server Error:', err);
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal server error. Please try again later.';
    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};
