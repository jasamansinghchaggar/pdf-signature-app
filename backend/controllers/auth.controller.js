import authService from '../services/auth.service.js';

class AuthController {
    // Register new user
    async register(req, res) {
        try {
            const result = await authService.register(req.body);

            // Set cookies
            const cookieOptions = {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            };

            res.cookie('accessToken', result.tokens.accessToken, {
                ...cookieOptions,
                maxAge: 15 * 60 * 1000 // 15 minutes
            });

            res.cookie('refreshToken', result.tokens.refreshToken, cookieOptions);

            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                data: {
                    user: result.user,
                    accessToken: result.tokens.accessToken
                }
            });

        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // Login user
    async login(req, res) {
        try {
            const result = await authService.login(req.body);

            // Set cookies
            const cookieOptions = {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            };

            res.cookie('accessToken', result.tokens.accessToken, {
                ...cookieOptions,
                maxAge: 15 * 60 * 1000 // 15 minutes
            });

            res.cookie('refreshToken', result.tokens.refreshToken, cookieOptions);

            res.status(200).json({
                success: true,
                message: 'Login successful',
                data: {
                    user: result.user,
                    accessToken: result.tokens.accessToken
                }
            });

        } catch (error) {
            res.status(401).json({
                success: false,
                message: error.message
            });
        }
    }

    // Refresh access token
    async refreshToken(req, res) {
        try {
            const refreshToken = req.cookies?.refreshToken;
            const result = await authService.refreshAccessToken(refreshToken);

            // Set new cookies
            const cookieOptions = {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            };

            res.cookie('accessToken', result.tokens.accessToken, {
                ...cookieOptions,
                maxAge: 60 * 60 * 1000 // 1 day
            });

            res.cookie('refreshToken', result.tokens.refreshToken, cookieOptions);

            res.status(200).json({
                success: true,
                message: 'Token refreshed successfully',
                data: {
                    accessToken: result.tokens.accessToken
                }
            });

        } catch (error) {
            res.status(401).json({
                success: false,
                message: error.message
            });
        }
    }

    // Logout user
    async logout(req, res) {
        try {
            await authService.logout(req.user._id);

            // Clear cookies
            res.clearCookie('accessToken');
            res.clearCookie('refreshToken');

            res.status(200).json({
                success: true,
                message: 'Logged out successfully'
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    // Change password
    async changePassword(req, res) {
        try {
            const result = await authService.changePassword(req.user._id, req.body);

            res.status(200).json({
                success: true,
                message: result.message
            });

        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    // Get user profile
    async getProfile(req, res) {
        try {
            const user = await authService.getProfile(req.user._id);

            res.status(200).json({
                success: true,
                message: 'Profile retrieved successfully',
                data: { user }
            });

        } catch (error) {
            res.status(404).json({
                success: false,
                message: error.message
            });
        }
    }

    // Update user profile
    async updateProfile(req, res) {
        try {
            const user = await authService.updateProfile(req.user._id, req.body);

            res.status(200).json({
                success: true,
                message: 'Profile updated successfully',
                data: { user }
            });

        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
}

export default new AuthController();
