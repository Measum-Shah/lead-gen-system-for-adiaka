# Lead Capture & Follow-Up System - Backend

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   - Copy `.env.example` to `.env`
   - Update all values with your actual credentials

3. **Generate Admin Password Hash**
   ```bash
   node -e "import('bcryptjs').then(bcrypt => bcrypt.hash('your-password', 10).then(console.log))"
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **Start Production Server**
   ```bash
   npm start
   ```

## Project Structure

```
server/
├── config/          # Configuration files (database, etc.)
├── controllers/     # Route controllers
├── middleware/      # Custom middleware
├── models/          # Mongoose models
├── routes/          # API routes
├── services/        # Business logic (email, SMS, notifications)
├── templates/       # Email templates
├── .env.example     # Environment variables template
├── .gitignore       # Git ignore rules
├── package.json     # Dependencies and scripts
└── server.js        # Application entry point
```

## API Endpoints

### Webhook
- `POST /api/webhook/lead` - Receive lead submissions from WordPress

### Authentication
- `POST /api/auth/login` - Admin login

### Leads Management
- `GET /api/leads` - List leads with filters and pagination
- `PATCH /api/leads/:id/status` - Update lead status
- `POST /api/leads/:id/resend` - Resend first-touch notifications
- `GET /api/leads/export` - Export leads to Excel

## Environment Variables

See `.env.example` for all required configuration values.
