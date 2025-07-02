import User from '../models/user.model.js';
import { generateTokens, verifyRefreshToken } from '../config/jwt.config.js';

class AuthService {
    // Register a new user
    async register(userData) {
        const { name, email, password } = userData;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw new Error('User with this email already exists');
        }

        // Create new user
        const user = new User({
            name,
            email,
            password
        });

        await user.save();

        // Generate tokens
        const tokens = generateTokens({ userId: user._id });

        // Save refresh token to user
        user.refreshToken = tokens.refreshToken;
        await user.save();

        return {
            user,
            tokens
        };
    }

    // Login user
    async login(loginData) {
        const { email, password } = loginData;

        // Find user by email
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            throw new Error('Invalid email or password');
        }

        // Check if user is active
        if (!user.isActive) {
            throw new Error('Account is deactivated');
        }

        // Compare password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            throw new Error('Invalid email or password');
        }

        // Generate tokens
        const tokens = generateTokens({ userId: user._id });

        // Save refresh token to user
        user.refreshToken = tokens.refreshToken;
        await user.save();

        // Remove password from user object
        user.password = undefined;

        return {
            user,
            tokens
        };
    }

    // Refresh access token
    async refreshAccessToken(refreshToken) {
        if (!refreshToken) {
            throw new Error('Refresh token is required');
        }

        try {
            // Verify refresh token
            const decoded = verifyRefreshToken(refreshToken);

            // Find user with this refresh token
            const user = await User.findById(decoded.userId);
            if (!user || user.refreshToken !== refreshToken) {
                throw new Error('Invalid refresh token');
            }

            // Check if user is active
            if (!user.isActive) {
                throw new Error('Account is deactivated');
            }

            // Generate new tokens
            const tokens = generateTokens({ userId: user._id });

            // Update refresh token
            user.refreshToken = tokens.refreshToken;
            await user.save();

            return {
                user,
                tokens
            };

        } catch (error) {
            throw new Error('Invalid refresh token');
        }
    }

    // Logout user
    async logout(userId) {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Clear refresh token
        user.refreshToken = null;
        await user.save();

        return { message: 'Logged out successfully' };
    }

    // Change password
    async changePassword(userId, passwordData) {
        const { currentPassword, newPassword } = passwordData;

        const user = await User.findById(userId).select('+password');
        if (!user) {
            throw new Error('User not found');
        }

        // Verify current password
        const isCurrentPasswordValid = await user.comparePassword(currentPassword);
        if (!isCurrentPasswordValid) {
            throw new Error('Current password is incorrect');
        }

        // Update password
        user.password = newPassword;
        await user.save();

        return { message: 'Password changed successfully' };
    }

    // Get user profile
    async getProfile(userId) {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        return user;
    }

    // Update user profile
    async updateProfile(userId, updateData) {
        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Check if email is being updated and if it already exists
        if (updateData.email && updateData.email !== user.email) {
            const existingUser = await User.findOne({ email: updateData.email });
            if (existingUser) {
                throw new Error('Email is already in use');
            }
        }

        // Update user data
        Object.assign(user, updateData);
        await user.save();

        return user;
    }
}

export default new AuthService();
