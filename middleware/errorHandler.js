const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const isDev = process.env.NODE_ENV === 'development';

  if (status >= 500) {
    console.error(`[Error] ${err.message}`, err.stack);
  }

  const wantsJson =
    req.originalUrl.startsWith('/api/') ||
    (req.headers.accept && req.headers.accept.includes('application/json'));

  if (!wantsJson) {
    const view = status === 403 ? 'errors/403' : status === 404 ? 'errors/404' : 'errors/500';
    return res.status(status).render(view, {
      layout: 'main',
      pageTitle: `Error ${status}`,
      message: err.message || 'Something went wrong',
      status,
    });
  }

  res.status(status).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(isDev && status >= 500 && { stack: err.stack }),
  });
};

module.exports = errorHandler;
