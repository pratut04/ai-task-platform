import { Response, NextFunction } from 'express';
import authService from '../services/auth.service';
import { AuthRequest } from '../types';
import userRepository from '../repositories/user.repository';
import { sendUnauthorized, sendForbidden } from '../utils/response';
import logger from '../utils/logger';

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendUnauthorized(res, 'No token provided');
      return;
    }

    const token = authHeader.split(' ')[1];
    const payload = authService.verifyAccessToken(token);

    const user = await userRepository.findById(payload.id);
    if (!user) {
      sendUnauthorized(res, 'User not found');
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    logger.warn('Auth middleware failed:', error);
    sendUnauthorized(res, 'Invalid or expired token');
  }
};

// Role-based authorization middleware factory
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendUnauthorized(res);
      return;
    }

    if (!roles.includes(req.user.role)) {
      sendForbidden(res, 'You do not have permission to perform this action');
      return;
    }

    next();
  };
};
