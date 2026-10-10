import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'govprep_super_secret_jwt_key_2026';
export const generateToken = (payload, expiresIn = '7d') => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
};
export const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    }
    catch (err) {
        return null;
    }
};
