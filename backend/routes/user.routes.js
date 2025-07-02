import { Router } from "express";
import authController from '../controllers/auth.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validation.middleware.js';
import {
    registerSchema,
    loginSchema,
    changePasswordSchema,
    updateProfileSchema
} from '../validations/user.validation.js';

const userRouter = Router();

// Auth routes
userRouter.post('/register', validateRequest(registerSchema), authController.register);
userRouter.post('/login', validateRequest(loginSchema), authController.login);
userRouter.post('/refresh-token', authController.refreshToken);
userRouter.post('/logout', authenticateToken, authController.logout);

// Protected routes
userRouter.get('/profile', authenticateToken, authController.getProfile);
userRouter.put('/profile', authenticateToken, validateRequest(updateProfileSchema), authController.updateProfile);
userRouter.post('/change-password', authenticateToken, validateRequest(changePasswordSchema), authController.changePassword);

export default userRouter;