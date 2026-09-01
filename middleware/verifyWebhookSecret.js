import crypto from 'crypto';

/**
 * Webhook Authentication Middleware
 * 
 * Validates that incoming webhook requests contain a valid shared secret
 * in the x-webhook-secret header. This prevents unauthorized submissions
 * to the lead capture endpoint.
 * 
 * Uses constant-time comparison to prevent timing attacks.
 */

const verifyWebhookSecret = (req, res, next) => {
  // Get the webhook secret from the request header
  const requestSecret = req.headers['x-webhook-secret'];
  
  // Get the expected secret from environment variables
  const expectedSecret = process.env.WEBHOOK_SECRET;
  
  // Check if the expected secret is configured
  if (!expectedSecret) {
    console.error('WEBHOOK_SECRET is not configured in environment variables');
    return res.status(500).json({
      success: false,
      message: 'Webhook authentication is not properly configured'
    });
  }
  
  // Check if the request includes the secret header
  if (!requestSecret) {
    console.warn('Webhook request received without x-webhook-secret header');
    return res.status(401).json({
      success: false,
      message: 'Missing webhook secret. Please provide x-webhook-secret header.'
    });
  }
  
  // Perform constant-time comparison to prevent timing attacks
  try {
    const requestBuffer = Buffer.from(requestSecret, 'utf8');
    const expectedBuffer = Buffer.from(expectedSecret, 'utf8');
    
    // Only compare if both buffers are the same length
    if (requestBuffer.length !== expectedBuffer.length) {
      console.warn('Webhook request received with invalid secret (length mismatch)');
      return res.status(401).json({
        success: false,
        message: 'Invalid webhook secret. Access denied.'
      });
    }
    
    // Constant-time comparison
    const isValid = crypto.timingSafeEqual(requestBuffer, expectedBuffer);
    
    if (!isValid) {
      console.warn('Webhook request received with invalid secret');
      return res.status(401).json({
        success: false,
        message: 'Invalid webhook secret. Access denied.'
      });
    }
    
    // Secret is valid, proceed to the next middleware/route handler
    next();
    
  } catch (error) {
    console.error('Error during webhook secret verification:', error);
    return res.status(500).json({
      success: false,
      message: 'Error verifying webhook secret'
    });
  }
};

export default verifyWebhookSecret;
