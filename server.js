import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import validateEnvironment from './utils/validateEnv.js';

// Load environment variables
dotenv.config();

// Validate environment variables (fails fast if critical vars missing)
validateEnvironment();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware shocshuoasviuebviebyerbvuyhberyuyerbvyuryuerbevyuuer
// updated
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration - locked down to specific origins for security
const allowedOrigins = [
  process.env.FRONTEND_ORIGIN,  // Netlify deployment (e.g., https://your-app.netlify.app)
  process.env.CLIENT_URL,       // Alternative frontend URL (development or custom domain)
  process.env.WORDPRESS_URL     // WordPress site origin
].filter(Boolean); // Remove undefined values

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true // Required for cookies; JWT via Authorization header doesn't need this but harmless
};
app.use(cors(corsOptions));

// Health check routes (for uptime monitoring to prevent Render free tier cold starts)
// These endpoints are public (no auth) so uptime services can ping them
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Lead Capture API is running',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Lead Capture API is running',
    timestamp: new Date().toISOString()
  });
});

// Import routes
import webhookRoutes from './routes/webhook.js';
import leadsRoutes from './routes/leads.js';
import authRoutes from './routes/auth.js';
import settingsRoutes from './routes/settings.js';
import { initCampaignCron } from './cron/campaignCron.js';

// Mount routes
app.use('/api/webhook', webhookRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/settings', settingsRoutes);

// Initialize Cron Jobs
initCampaignCron();

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
