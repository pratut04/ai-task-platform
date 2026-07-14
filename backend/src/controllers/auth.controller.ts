import { Response, NextFunction } from 'express';
import authService from '../services/auth.service';
import { AuthRequest } from '../types';
import { sendSuccess, sendCreated, sendBadRequest, sendUnauthorized } from '../utils/response';
import logger from '../utils/logger';

export class AuthController {
  async register(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, password } = req.body;
      const result = await authService.register({ name, email, password });

      logger.info(`New user registered: ${email}`);
      sendCreated(res, result, 'User registered successfully');
    } catch (error) {
      next(error);
    }
  }

  async login(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await authService.login({ email, password });

      logger.info(`User logged in: ${email}`);
      sendSuccess(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  async refresh(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        sendBadRequest(res, 'Refresh token is required');
        return;
      }

      const tokens = await authService.refreshToken(refreshToken);
      sendSuccess(res, tokens, 'Token refreshed successfully');
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendUnauthorized(res);
        return;
      }

      const user = await authService.getProfile(req.user._id.toString());
      sendSuccess(res, user, 'Profile fetched successfully');
    } catch (error) {
      next(error);
    }
  }

  logout(_req: AuthRequest, res: Response): void {
    // Stateless JWT - client should clear tokens
    sendSuccess(res, null, 'Logged out successfully');
  }
}

export default new AuthController();
