import { Router } from 'express';
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
  (req, res, next) => authController.register(req, res, next)
);

/**
 * @route  POST /api/auth/login
 * @access Public
 */
router.post(
  '/login',
  loginValidator,
  validate,
  (req, res, next) => authController.login(req, res, next)
);

/**
 * @route  POST /api/auth/refresh
 * @access Public
 */
router.post(
  '/refresh',
  refreshTokenValidator,
  validate,
  (req, res, next) => authController.refresh(req, res, next)
);

/**
 * @route  GET /api/auth/profile
 * @access Protected
 */
router.get(
  '/profile',
  authenticate,
  (req, res, next) => authController.getProfile(req, res, next)
);

/**
 * @route  POST /api/auth/logout
 * @access Protected
 */
router.post(
  '/logout',
  authenticate,
  (req, res) => authController.logout(req, res)
);

export default router;
