const authService = require('../services/authService');
const { STATUS_CODES, ERROR_MESSAGES } = require('../config/constants');
const helpers = require('../utils/helpers');

class AuthController {
  async register(req, res, next) {
    try {
      const { email, password, name } = req.body;

      const user = await authService.register(email, password, name);

      res.status(STATUS_CODES.CREATED).json(
        helpers.successResponse(user, 'User registered successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      const user = await authService.login(email, password);

      res.status(STATUS_CODES.OK).json(
        helpers.successResponse(user, 'Login successful')
      );
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(STATUS_CODES.BAD_REQUEST).json(
          helpers.errorResponse('Refresh token required')
        );
      }

      const user = await authService.refreshToken(refreshToken);

      res.status(STATUS_CODES.OK).json(
        helpers.successResponse(user, 'Token refreshed successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      const userId = req.userId;
      await authService.logout(userId);

      res.status(STATUS_CODES.OK).json(
        helpers.successResponse(null, 'Logout successful')
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
