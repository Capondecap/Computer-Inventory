const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const isDev = process.env.NODE_ENV === 'development';

  if (status >= 500) {
    console.error(`[Error] ${err.message}`, err.stack);
  }

  res.status(status).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(isDev && status >= 500 && { stack: err.stack }),
  });
};

module.exports = errorHandler;
