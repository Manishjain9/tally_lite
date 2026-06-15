const jwt = require('jsonwebtoken');
const { STATUS_CODES, ERROR_MESSAGES } = require('../config/constants');

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(STATUS_CODES.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED,
      });
    }

    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_super_secret_jwt_key');

    req.userId = decoded.userId;
    req.email = decoded.email;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(STATUS_CODES.UNAUTHORIZED).json({
        success: false,
        message: 'Token expired',
        code: 'TOKEN_EXPIRED',
      });
    }

    return res.status(STATUS_CODES.UNAUTHORIZED).json({
      success: false,
      message: ERROR_MESSAGES.INVALID_TOKEN,
    });
  }
};

module.exports = authMiddleware;
