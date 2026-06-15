const { STATUS_CODES } = require('../config/constants');

const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Validation errors
  if (err.details) {
    return res.status(STATUS_CODES.BAD_REQUEST).json({
      success: false,
      message: 'Validation error',
      errors: err.details,
    });
  }

  // Database errors
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(STATUS_CODES.CONFLICT).json({
      success: false,
      message: 'Duplicate entry',
    });
  }

  if (err.code === 'ER_NO_REFERENCED_ROW' || err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(STATUS_CODES.BAD_REQUEST).json({
      success: false,
      message: 'Referenced record not found',
    });
  }

  // Default error
  const status = err.statusCode || STATUS_CODES.INTERNAL_ERROR;
  const message = err.message || 'Internal server error';

  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { error: err.stack }),
  });
};

module.exports = errorHandler;
