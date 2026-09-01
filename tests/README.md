# Testing Guide

## Overview
This directory contains test files for the Lead Capture API endpoints and business logic.

## Test Files

### 1. `testWebhookController.js`
Tests the webhook controller validation logic without requiring a running server.

**Run:**
```bash
node tests/testWebhookController.js
```

**Tests:**
- Valid lead data validation
- Missing required fields detection
- Invalid phone number rejection
- Phone number normalization (E.164 format)
- Multiple validation errors
- Custom source field handling

### 2. `testWebhookEndpoint.js`
Integration tests for the webhook endpoint with HTTP requests.

**Prerequisites:**
- Server must be running on port 5000
- MongoDB connection configured

**Run:**
```bash
# Terminal 1: Start the server
npm run dev

# Terminal 2: Run tests
npm run test:webhook
```

**Tests:**
- Valid lead submission
- Missing webhook secret rejection
- Invalid webhook secret rejection
- Missing required field validation
- Invalid email format validation
- Invalid phone number validation
- Custom source field
- Duplicate email handling (update existing)
- International phone format
- Name length validation

## Environment Setup

Make sure `.env` file has the following configured:
```
WEBHOOK_SECRET=my-super-secret-webhook-key-2024
MONGO_URI=mongodb+srv://...
```

## Expected Results

All tests should pass with ✓ markers. Failed tests will show ✗ markers.

### Webhook Endpoint Expected Responses

**Success (201):**
```json
{
  "success": true,
  "message": "Lead received successfully",
  "leadId": "6581f2e4a3b1c8d9e0f1a2b3"
}
```

**Validation Error (400):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": ["Name is required", "Invalid email format"]
}
```

**Authentication Error (401):**
```json
{
  "success": false,
  "message": "Invalid webhook secret. Access denied."
}
```

## Testing with cURL

### Valid Request
```bash
curl -X POST http://localhost:5000/api/webhook/lead \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: my-super-secret-webhook-key-2024" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "03001234567"
  }'
```

### Invalid Secret
```bash
curl -X POST http://localhost:5000/api/webhook/lead \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: wrong-secret" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "03001234567"
  }'
```

### Missing Field
```bash
curl -X POST http://localhost:5000/api/webhook/lead \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: my-super-secret-webhook-key-2024" \
  -d '{
    "name": "John Doe",
    "phone": "03001234567"
  }'
```

## Testing with Postman

1. **Create a new POST request:**
   - URL: `http://localhost:5000/api/webhook/lead`
   
2. **Add Headers:**
   - `Content-Type: application/json`
   - `x-webhook-secret: my-super-secret-webhook-key-2024`

3. **Add Body (raw JSON):**
   ```json
   {
     "name": "Ahmed Khan",
     "email": "ahmed@example.com",
     "phone": "03001234567",
     "source": "wordpress-form"
   }
   ```

4. **Send Request**
   - Expected Status: 201 Created
   - Expected Response: Success message with leadId

## Notes

- Phone numbers are automatically normalized to E.164 format (+923001234567)
- Duplicate emails will update existing leads instead of creating new ones
- Notifications are triggered asynchronously after lead creation (currently placeholder)
- All validation errors are returned in a consistent format
