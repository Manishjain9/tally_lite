const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { STATUS_CODES, ERROR_MESSAGES } = require('../config/constants');

class AuthService {
  async register(email, password, name) {
    const connection = await pool.getConnection();

    try {
      // Check if user exists
      const [existingUser] = await connection.execute(
        'SELECT user_id FROM users WHERE email = ?',
        [email]
      );

      if (existingUser.length > 0) {
        throw {
          statusCode: STATUS_CODES.CONFLICT,
          message: ERROR_MESSAGES.USER_EXISTS,
        };
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const [result] = await connection.execute(
        'INSERT INTO users (email, password, name) VALUES (?, ?, ?)',
        [email, hashedPassword, name]
      );

      return {
        userId: result.insertId,
        email,
        name,
      };
    } finally {
      connection.release();
    }
  }

  async login(email, password) {
    const connection = await pool.getConnection();

    try {
      // Get user
      const [users] = await connection.execute(
        'SELECT user_id, email, password, name FROM users WHERE email = ?',
        [email]
      );

      if (users.length === 0) {
        throw {
          statusCode: STATUS_CODES.UNAUTHORIZED,
          message: ERROR_MESSAGES.INVALID_CREDENTIALS,
        };
      }

      const user = users[0];

      // Verify password
      const validPassword = await bcrypt.compare(password, user.password);

      if (!validPassword) {
        throw {
          statusCode: STATUS_CODES.UNAUTHORIZED,
          message: ERROR_MESSAGES.INVALID_CREDENTIALS,
        };
      }

      // Generate tokens
      const accessToken = jwt.sign(
        { userId: user.user_id, email: user.email },
        process.env.JWT_SECRET || 'your_super_secret_jwt_key',
        { expiresIn: process.env.JWT_EXPIRE || '1h' }
      );

      const refreshToken = jwt.sign(
        { userId: user.user_id, email: user.email },
        process.env.JWT_REFRESH_SECRET || 'your_super_secret_refresh_key',
        { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
      );

      // Store refresh token
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await connection.execute(
        'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
        [user.user_id, refreshToken, expiresAt]
      );

      return {
        userId: user.user_id,
        email: user.email,
        name: user.name,
        accessToken,
        refreshToken,
      };
    } finally {
      connection.release();
    }
  }

  async refreshToken(refreshToken) {
    const connection = await pool.getConnection();

    try {
      // Verify refresh token
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || 'your_super_secret_refresh_key'
      );

      // Check if token exists in DB
      const [tokens] = await connection.execute(
        'SELECT token_id FROM refresh_tokens WHERE user_id = ? AND token = ? AND expires_at > NOW()',
        [decoded.userId, refreshToken]
      );

      if (tokens.length === 0) {
        throw {
          statusCode: STATUS_CODES.UNAUTHORIZED,
          message: ERROR_MESSAGES.INVALID_TOKEN,
        };
      }

      // Get user
      const [users] = await connection.execute(
        'SELECT user_id, email, name FROM users WHERE user_id = ?',
        [decoded.userId]
      );

      if (users.length === 0) {
        throw {
          statusCode: STATUS_CODES.NOT_FOUND,
          message: ERROR_MESSAGES.USER_NOT_FOUND,
        };
      }

      const user = users[0];

      // Generate new tokens
      const newAccessToken = jwt.sign(
        { userId: user.user_id, email: user.email },
        process.env.JWT_SECRET || 'your_super_secret_jwt_key',
        { expiresIn: process.env.JWT_EXPIRE || '1h' }
      );

      return {
        userId: user.user_id,
        email: user.email,
        name: user.name,
        accessToken: newAccessToken,
        refreshToken,
      };
    } finally {
      connection.release();
    }
  }

  async logout(userId) {
    const connection = await pool.getConnection();

    try {
      await connection.execute(
        'DELETE FROM refresh_tokens WHERE user_id = ?',
        [userId]
      );
      return true;
    } finally {
      connection.release();
    }
  }
}

module.exports = new AuthService();
