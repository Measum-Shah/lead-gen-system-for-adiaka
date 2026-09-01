import jwt from 'jsonwebtoken';

/**
 * Authentication Middleware
 * 
 * Validates JWT tokens for protected admin routes.
 * Expects token in Authorization header as "Bearer <token>"
 */

const requireAuth = (req, res, next) => {
  try {
    // Get authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please provide authorization token.'
      });
    }
    
    // Check if it's a Bearer token
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authorization format. Use: Bearer <token>'
      });
    }
    
    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token is missing'
      });
    }
    
    // Verify token
    const jwtSecret = process.env.JWT_SECRET;
    
    if (!jwtSecret) {
      console.error('JWT_SECRET is not configured in environment variables');
      return res.status(500).json({
        success: false,
        message: 'Authentication is not properly configured'
      });
    }
    
    const decoded = jwt.verify(token, jwtSecret);
    
    // Attach user info to request object
    req.user = decoded;
    
    // Proceed to next middleware/route handler
    next();
    
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Authentication token has expired. Please login again.'
      });
    }
    
    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error verifying authentication'
    });
  }
};

export default requireAuth;
