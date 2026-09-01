import express from 'express';
import { login, verifyToken, hashPassword } from '../controllers/authController.js';
import requireAuth from '../middleware/requireAuth.js';

const router = express.Router();

/**
 * @route   POST /api/auth/login
 * @desc    Admin login - returns JWT token
 * @access  Public
 * @body    { email: string, password: string }
 */
router.post('/login', login);

/**
 * @route   GET /api/auth/verify
 * @desc    Verify JWT token validity
 * @access  Protected (requires JWT)
 */
router.get('/verify', requireAuth, verifyToken);

/**
 * @route   POST /api/auth/hash-password
 * @desc    Generate bcrypt hash for password (development only)
 * @access  Public (disabled in production)
 * @body    { password: string }
 */
router.post('/hash-password', hashPassword);

export default router;
