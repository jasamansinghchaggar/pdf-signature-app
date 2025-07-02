import jwt from 'jsonwebtoken';

export const generateAccessToken = (payload) => {
    return jwt.sign(
        payload,
        process.env.JWT_ACCESS_SECRET,
        { 
            expiresIn: process.env.JWT_ACCESS_EXPIRY 
        }
    );
};

export const generateRefreshToken = (payload) => {
    return jwt.sign(
        payload,
        process.env.JWT_REFRESH_SECRET,
        { 
            expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' 
        }
    );
};

export const verifyAccessToken = (token) => {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
};

export const verifyRefreshToken = (token) => {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

export const generateTokens = (payload) => {
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);
    
    return { accessToken, refreshToken };
};
