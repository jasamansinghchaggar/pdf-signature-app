import dotenv from 'dotenv';
import express from 'express';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';
import connectDB from './config/database.js';
import userRouter from './routes/user.routes.js';
import documentRouter from './routes/document.routes.js';
import signatureRouter from './routes/signature.routes.js';
import auditRouter from './routes/audit.routes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// CORS configuration
const allowedOrigins = process.env.CLIENT_URLS.split(',');

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(morgan('dev'));
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(cookieParser());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Basic route
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Welcome to the PDF Signature App Backend!',
        timestamp: new Date().toISOString()
    });
});

// API routes
app.use('/api/v1/auth', userRouter);
app.use('/api/v1/docs', documentRouter);
app.use('/api/v1/signatures', signatureRouter);
app.use('/api/v1/audit', auditRouter);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Global error handler
app.use((error, req, res, next) => {
    console.error('Error:', error);
    
    res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Server is also accessible on http://192.168.1.7:${PORT}`);
});