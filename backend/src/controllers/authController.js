import { prisma } from '../config/db.js';
import { hashPassword, comparePassword } from '../utils/hash.js';
import { generateToken } from '../utils/jwt.js';
export class AuthController {
    static async register(req, res) {
        try {
            const { 
                name, 
                email, 
                password, 
                phone,
                targetExam, 
                targetYear,
                category, 
                state, 
                qualification, 
                gender, 
                dob,
                preferredLanguage 
            } = req.body;
            if (!name || !email || !password) {
                res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
                return;
            }
            const existingUser = await prisma.user.findUnique({
                where: { email: email.trim().toLowerCase() },
            });
            if (existingUser) {
                res.status(400).json({ success: false, message: 'An account with this email already exists.' });
                return;
            }
            const hashedPassword = await hashPassword(password);
            // Public registration ALWAYS creates a USER role and records complete candidate metadata
            const user = await prisma.user.create({
                data: {
                    name: name.trim(),
                    email: email.trim().toLowerCase(),
                    password: hashedPassword,
                    role: 'USER',
                    phone: phone ? phone.trim() : null,
                    targetExam: targetExam || 'RRB NTPC',
                    targetYear: targetYear || '2026',
                    category: category || 'General',
                    state: state ? state.trim() : null,
                    qualification: qualification ? qualification.trim() : null,
                    gender: gender || null,
                    dob: dob || null,
                    preferredLanguage: preferredLanguage || 'English',
                    status: 'Active',
                    joinedDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
                },
            });
            const token = generateToken({
                userId: user.id,
                email: user.email,
                role: user.role,
            });
            res.status(201).json({
                success: true,
                message: 'Registration successful.',
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    targetExam: user.targetExam,
                    targetYear: user.targetYear,
                    category: user.category,
                    state: user.state,
                    qualification: user.qualification,
                    gender: user.gender,
                    dob: user.dob,
                    preferredLanguage: user.preferredLanguage,
                    status: user.status,
                    joinedDate: user.joinedDate,
                    createdAt: user.createdAt,
                },
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message || 'Registration failed.' });
        }
    }
    static async login(req, res) {
        try {
            const { email, password, role } = req.body;
            if (!email || !password) {
                res.status(400).json({ success: false, message: 'Email and password are required.' });
                return;
            }
            const user = await prisma.user.findUnique({
                where: { email: email.trim().toLowerCase() },
            });
            if (!user) {
                res.status(401).json({ success: false, message: 'Invalid email or password.' });
                return;
            }
            const isPasswordValid = await comparePassword(password, user.password);
            if (!isPasswordValid) {
                res.status(401).json({ success: false, message: 'Invalid email or password.' });
                return;
            }
            // If a role was requested, verify role matches
            if (role && user.role !== role) {
                res.status(403).json({
                    success: false,
                    message: `Access denied. Your account does not have ${role} privileges.`,
                });
                return;
            }
            const token = generateToken({
                userId: user.id,
                email: user.email,
                role: user.role,
            });
            res.status(200).json({
                success: true,
                message: 'Login successful.',
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    role: user.role,
                    targetExam: user.targetExam,
                    targetYear: user.targetYear,
                    category: user.category,
                    state: user.state,
                    qualification: user.qualification,
                    gender: user.gender,
                    dob: user.dob,
                    preferredLanguage: user.preferredLanguage,
                    status: user.status,
                    joinedDate: user.joinedDate,
                    avatarUrl: user.avatarUrl,
                    createdAt: user.createdAt,
                },
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message || 'Login failed.' });
        }
    }
    static async me(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }
            const user = await prisma.user.findUnique({
                where: { id: req.user.id },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    role: true,
                    targetExam: true,
                    targetYear: true,
                    category: true,
                    state: true,
                    qualification: true,
                    gender: true,
                    dob: true,
                    preferredLanguage: true,
                    avatarUrl: true,
                    status: true,
                    joinedDate: true,
                    createdAt: true,
                },
            });
            // Fetch summary stats
            const testsAttempted = await prisma.testAttempt.count({
                where: { userId: req.user.id, isCompleted: true },
            });
            const avgScore = await prisma.testAttempt.aggregate({
                where: { userId: req.user.id, isCompleted: true },
                _avg: { score: true },
            });
            res.status(200).json({
                success: true,
                user: {
                    ...user,
                    testsAttempted,
                    averageScore: avgScore._avg.score ? Math.round(avgScore._avg.score * 10) / 10 : 0,
                },
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message || 'Failed to fetch user profile.' });
        }
    }
    static async updateProfile(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }
            const { 
                name, 
                phone, 
                targetExam, 
                targetYear, 
                category, 
                state, 
                qualification, 
                gender, 
                dob, 
                preferredLanguage 
            } = req.body;
            const updated = await prisma.user.update({
                where: { id: req.user.id },
                data: {
                    ...(name && { name: name.trim() }),
                    ...(phone !== undefined && { phone: phone ? phone.trim() : null }),
                    ...(targetExam && { targetExam }),
                    ...(targetYear && { targetYear }),
                    ...(category && { category }),
                    ...(state !== undefined && { state: state ? state.trim() : null }),
                    ...(qualification !== undefined && { qualification: qualification ? qualification.trim() : null }),
                    ...(gender !== undefined && { gender }),
                    ...(dob !== undefined && { dob }),
                    ...(preferredLanguage && { preferredLanguage }),
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    role: true,
                    targetExam: true,
                    targetYear: true,
                    category: true,
                    state: true,
                    qualification: true,
                    gender: true,
                    dob: true,
                    preferredLanguage: true,
                    avatarUrl: true,
                    status: true,
                    joinedDate: true,
                    createdAt: true,
                },
            });
            res.status(200).json({
                success: true,
                message: 'Profile updated successfully.',
                user: updated,
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message || 'Failed to update profile.' });
        }
    }
    static async changePassword(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }
            const { currentPassword, newPassword } = req.body;
            if (!currentPassword || !newPassword) {
                res.status(400).json({ success: false, message: 'Current and new password are required.' });
                return;
            }
            const user = await prisma.user.findUnique({
                where: { id: req.user.id },
            });
            if (!user) {
                res.status(404).json({ success: false, message: 'User not found.' });
                return;
            }
            const isMatch = await comparePassword(currentPassword, user.password);
            if (!isMatch) {
                res.status(400).json({ success: false, message: 'Current password is incorrect.' });
                return;
            }
            const hashedPassword = await hashPassword(newPassword);
            await prisma.user.update({
                where: { id: user.id },
                data: { password: hashedPassword },
            });
            res.status(200).json({ success: true, message: 'Password changed successfully.' });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message || 'Failed to change password.' });
        }
    }
    static async logout(req, res) {
        res.status(200).json({ success: true, message: 'Logged out successfully.' });
    }
}
