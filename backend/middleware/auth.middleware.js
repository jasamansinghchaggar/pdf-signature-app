import { verifyAccessToken } from '../config/jwt.config.js';
import User from '../models/user.model.js';

export const authenticateToken = async (req, res, next) => {
    try {
        // Get token from cookies or Authorization header
        const token = req.cookies?.accessToken || 
                     req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access token is required'
            });
        }

        // Verify token
        const decoded = verifyAccessToken(token);
        
        // Find user and include refreshToken to check if user is logged in
        const user = await User.findById(decoded.userId).select('-password');
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid access token'
            });
        }

        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Account is deactivated'
            });
        }

        // Check if user is logged out (no refresh token means logged out)
        if (!user.refreshToken) {
            return res.status(401).json({
                success: false,
                message: 'User is logged out. Please login again.'
            });
        }

        // Remove refreshToken from user object before sending to controller
        user.refreshToken = undefined;

        // Add user to request object
        req.user = user;
        next();

    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid access token'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Access token expired'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Internal server error during authentication'
        });
    }
};
