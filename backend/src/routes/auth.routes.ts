import { Router, RequestHandler } from 'express';
import authController from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import {
  registerValidator,
  loginValidator,
  refreshTokenValidator,
} from '../validators/auth.validator';

const router = Router();

/**
 * @route  POST /api/auth/register
 * @access Public
 */
router.post(
  '/register',
  registerValidator,
  validate,
  authController.register.bind(authController) as RequestHandler
);

/**
 * @route  POST /api/auth/login
 * @access Public
 */
router.post(
  '/login',
  loginValidator,
  validate,
  authController.login.bind(authController) as RequestHandler
);

/**
 * @route  POST /api/auth/refresh
 * @access Public
 */
router.post(
  '/refresh',
  refreshTokenValidator,
  validate,
  authController.refresh.bind(authController) as RequestHandler
);

/**
 * @route  GET /api/auth/profile
 * @access Protected
 */
router.get(
  '/profile',
  authenticate,
  authController.getProfile.bind(authController) as RequestHandler
);

/**
 * @route  POST /api/auth/logout
 * @access Protected
 */
router.post(
  '/logout',
  authenticate,
  authController.logout.bind(authController) as RequestHandler
);

export default router;
