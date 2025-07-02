import { z } from 'zod';

// User registration validation schema
export const registerSchema = z.object({
    name: z
        .string()
        .min(2, 'Name must be at least 2 characters long')
        .max(50, 'Name must not exceed 50 characters')
        .trim(),
    email: z
        .string()
        .email('Please provide a valid email address')
        .toLowerCase()
        .trim(),
    password: z
        .string()
        .min(6, 'Password must be at least 6 characters long')
        .max(100, 'Password must not exceed 100 characters')
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 
            'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

// User login validation schema
export const loginSchema = z.object({
    email: z
        .string()
        .email('Please provide a valid email address')
        .toLowerCase()
        .trim(),
    password: z
        .string()
        .min(1, 'Password is required')
});

// Change password validation schema
export const changePasswordSchema = z.object({
    currentPassword: z
        .string()
        .min(1, 'Current password is required'),
    newPassword: z
        .string()
        .min(6, 'New password must be at least 6 characters long')
        .max(100, 'New password must not exceed 100 characters')
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 
            'New password must contain at least one lowercase letter, one uppercase letter, and one number'),
    confirmNewPassword: z.string()
}).refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "New passwords don't match",
    path: ["confirmNewPassword"],
});

// Update profile validation schema
export const updateProfileSchema = z.object({
    name: z
        .string()
        .min(2, 'Name must be at least 2 characters long')
        .max(50, 'Name must not exceed 50 characters')
        .trim()
        .optional(),
    email: z
        .string()
        .email('Please provide a valid email address')
        .toLowerCase()
        .trim()
        .optional()
});
