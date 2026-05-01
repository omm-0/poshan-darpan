/**
 * Standardized API response helpers.
 * Every controller must use these instead of raw res.json() / res.status().json() calls.
 */

function successResponse(res, statusCode, message, data = null) {
  const payload = {
    success: true,
    message
  };

  if (data !== null && data !== undefined) {
    payload.data = data;
  }

  return res.status(statusCode).json(payload);
}

function errorResponse(res, statusCode, message, errorCode = null, details = null) {
  const payload = {
    success: false,
    message
  };

  if (errorCode) {
    payload.error = errorCode;
  }

  if (details !== null && details !== undefined) {
    payload.details = details;
  }

  return res.status(statusCode).json(payload);
}

module.exports = { successResponse, errorResponse };
