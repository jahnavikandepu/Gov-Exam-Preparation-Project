import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { prisma } from './config/db.js';
const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const ADMIN_URL = process.env.ADMIN_URL || 'http://localhost:5174';
const allowedOrigins = Array.from(new Set([
    CLIENT_URL,
    ADMIN_URL,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174',
    'http://localhost:3000',
].filter(Boolean)));
// Middleware
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, server-to-server)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
            return callback(null, true);
        }
        return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
// Health check endpoint
app.get(['/health', '/api/health'], async (req, res) => {
    let dbStatus = 'disconnected';
    try {
        await prisma.$queryRaw `SELECT 1`;
        dbStatus = 'connected';
    }
    catch (dbErr) {
        dbStatus = 'error';
    }
    res.status(dbStatus === 'connected' ? 200 : 503).json({
        status: dbStatus === 'connected' ? 'healthy' : 'degraded',
        database: dbStatus,
        timestamp: new Date().toISOString(),
        service: 'GovPrep Adaptive Examination API Engine',
    });
});
// API Routes
app.use('/api', routes);
// 404 Handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: `Endpoint ${req.originalUrl} not found on this server.`,
    });
});
// Global Error Handler
app.use(errorHandler);
import { TestSyncService } from './services/test/testSyncService.js';
// Start server and verify DB connection
const server = app.listen(PORT, async () => {
    console.log(`====================================================`);
    console.log(`🚀 GovPrep Backend Engine running on http://localhost:${PORT}`);
    console.log(`📡 API Endpoints mounted at http://localhost:${PORT}/api`);
    console.log(`🔒 Environment: ${process.env.NODE_ENV || 'development'}`);
    try {
        await prisma.$queryRaw `SELECT 1`;
        console.log(`🗄️ Database connected successfully (PostgreSQL govprep)`);
        // Synchronize both official exam stage mocks and topic practice tests
        await TestSyncService.syncAllTests().catch((e) => console.warn('Tests sync warning:', e.message));
    }
    catch (err) {
        console.error(`❌ Database connection failed: Unable to reach PostgreSQL database.`);
    }
    console.log(`====================================================`);
});
export default app;
