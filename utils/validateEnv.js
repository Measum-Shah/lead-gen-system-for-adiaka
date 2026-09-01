/**
 * Environment Variable Validation
 * 
 * Validates required environment variables on startup.
 * Fails fast with clear error messages if critical variables are missing.
 */

const requiredEnvVars = [
  'MONGO_URI',
  'WEBHOOK_SECRET',
  'JWT_SECRET',
  'ADMIN_EMAIL',
  'ADMIN_PASSWORD_HASH',
  'FRONTEND_ORIGIN',
  'WORDPRESS_URL'
];

const optionalEnvVars = {
  'SMTP_HOST': 'Email service will not work',
  'SMTP_USER': 'Email service will not work',
  'SMTP_PASSWORD': 'Email service will not work',
  'EMAIL_FROM': 'Email service will not work',
  'TWILIO_ACCOUNT_SID': 'SMS service will not work',
  'TWILIO_AUTH_TOKEN': 'SMS service will not work',
  'TWILIO_PHONE_NUMBER': 'SMS service will not work',
  'DEFAULT_COUNTRY_CODE': 'Will default to PK'
};

export function validateEnvironment() {
  console.log('Validating environment variables...');
  
  const missing = [];
  const warnings = [];
  
  // Check required variables
  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }
  
  // Check optional variables (warnings only)
  for (const [varName, consequence] of Object.entries(optionalEnvVars)) {
    if (!process.env[varName]) {
      warnings.push(`${varName} (${consequence})`);
    }
  }
  
  // Report results
  if (missing.length > 0) {
    console.error('\n❌ FATAL: Missing required environment variables:');
    missing.forEach(varName => {
      console.error(`  - ${varName}`);
    });
    console.error('\nPlease configure these variables in your .env file or deployment environment.');
    console.error('See .env.example for reference.\n');
    process.exit(1);
  }
  
  if (warnings.length > 0) {
    console.warn('\n⚠️  WARNING: Missing optional environment variables:');
    warnings.forEach(warning => {
      console.warn(`  - ${warning}`);
    });
    console.warn('');
  }
  
  console.log('✓ Environment validation passed\n');
}

export default validateEnvironment;
