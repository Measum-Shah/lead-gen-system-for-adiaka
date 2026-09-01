import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

/**
 * Authentication Controller
 * 
 * Handles admin login with JWT token generation.
 * Uses single admin credential from environment variables.
 */

/**
 * Admin login
 * 
 * @route POST /api/auth/login
 * @access Public
 * @body { email: string, password: string }
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }
    
    // Get admin credentials from environment
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
    
    if (!adminEmail || !adminPasswordHash) {
      console.error('Admin credentials not configured in environment variables');
      return res.status(500).json({
        success: false,
        message: 'Authentication system is not properly configured'
      });
    }
    
    // Check email
    if (email.toLowerCase() !== adminEmail.toLowerCase()) {
      console.log(`Failed login attempt with email: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, adminPasswordHash);
    
    if (!isPasswordValid) {
      console.log(`Failed login attempt - invalid password for: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    // Get JWT configuration
    const jwtSecret = process.env.JWT_SECRET;
    const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
    
    if (!jwtSecret) {
      console.error('JWT_SECRET not configured');
      return res.status(500).json({
        success: false,
        message: 'Authentication system is not properly configured'
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      {
        email: adminEmail,
        role: 'admin',
        iat: Math.floor(Date.now() / 1000)
      },
      jwtSecret,
      { expiresIn: jwtExpiresIn }
    );
    
    // Decode token to get expiration
    const decoded = jwt.decode(token);
    const expiresAt = new Date(decoded.exp * 1000);
    
    console.log(`Successful login: ${email}`);
    
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        expiresAt: expiresAt.toISOString(),
        user: {
          email: adminEmail,
          role: 'admin'
        }
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during login',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

/**
 * Verify token (optional endpoint for client-side token validation)
 * 
 * @route GET /api/auth/verify
 * @access Protected (requires JWT)
 */
export const verifyToken = async (req, res) => {
  // If we reach here, the requireAuth middleware already validated the token
  res.json({
    success: true,
    message: 'Token is valid',
    data: {
      user: req.user
    }
  });
};

/**
 * Generate password hash (utility endpoint for development only)
 * 
 * @route POST /api/auth/hash-password
 * @access Public (should be disabled in production)
 * @body { password: string }
 */
export const hashPassword = async (req, res) => {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({
      success: false,
      message: 'Not found'
    });
  }
  
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required'
      });
    }
    
    const hash = await bcrypt.hash(password, 10);
    
    res.json({
      success: true,
      message: 'Password hashed successfully',
      data: {
        hash,
        instruction: 'Add this hash to your .env file as ADMIN_PASSWORD_HASH'
      }
    });
    
  } catch (error) {
    console.error('Hash generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating hash',
      error: error.message
    });
  }
};
