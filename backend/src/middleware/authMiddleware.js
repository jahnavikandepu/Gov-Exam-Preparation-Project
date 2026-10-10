import { verifyToken } from '../utils/jwt.js';
import { prisma } from '../config/db.js';
export const authenticateJWT = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
        return;
    }
    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    if (!payload) {
        res.status(401).json({ success: false, message: 'Invalid or expired authentication token.' });
        return;
    }
    try {
        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: { id: true, email: true, role: true, name: true, targetExam: true, status: true },
        });
        if (!user || user.status === 'Disabled') {
            res.status(401).json({ success: false, message: 'User account not found or disabled.' });
            return;
        }
        req.user = user;
        next();
    }
    catch (error) {
        res.status(500).json({ success: false, message: 'Authentication error.' });
    }
};
export const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'ADMIN') {
        res.status(403).json({ success: false, message: 'Forbidden. Admin privileges required.' });
        return;
    }
    next();
};
