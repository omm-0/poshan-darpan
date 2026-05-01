/**
 * Global error handler — catches anything thrown from controllers/middleware
 * that wasn't already handled. Must be the LAST middleware mounted on the app.
 */

function errorHandler(err, req, res, next) {
  console.error('[errorHandler] Unhandled Error:', err);

  const statusCode = err.statusCode && Number.isInteger(err.statusCode) ? err.statusCode : 500;
  const isDev = process.env.NODE_ENV === 'development';
  const message = isDev
    ? (err.message || 'Internal server error')
    : 'Internal server error';

  const payload = {
    success: false,
    message,
    error: err.code || 'INTERNAL_ERROR'
  };

  if (isDev && err.stack) {
    payload.stack = err.stack;
  }

  return res.status(statusCode).json(payload);
}

module.exports = errorHandler;
