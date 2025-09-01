# API Examples

## Authentication

All API endpoints (except `/health`) require authentication using the `x-api-token` header:

```bash
curl -H "x-api-token: your-api-token-here" \
     -H "Content-Type: application/json" \
     http://localhost:3000/api/v1/templates
```

## Send Simple Email

```bash
curl -X POST http://localhost:3000/api/v1/send-email \
  -H "x-api-token: your-api-token" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "sender@example.com",
    "to": "recipient@example.com",
    "subject": "Test Email",
    "html": "<h1>Hello World</h1><p>This is a test email.</p>",
    "text": "Hello World\n\nThis is a test email."
  }'
```

## Create Template

```bash
curl -X POST http://localhost:3000/api/v1/templates \
  -H "x-api-token: your-api-token" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "welcome-email",
    "name": "Welcome Email Template",
    "subject": "Welcome to {{companyName}}, {{userName}}!",
    "html": "<h1>Welcome {{userName}}!</h1><p>Thank you for joining {{companyName}}.</p><p>Click <a href=\"{{activationLink}}\">here</a> to activate your account.</p>",
    "defaults": {
      "companyName": "Our Company",
      "from": "welcome@example.com"
    }
  }'
```

## Send Template Email

```bash
curl -X POST http://localhost:3000/api/v1/send-template \
  -H "x-api-token: your-api-token" \
  -H "Content-Type: application/json" \
  -d '{
    "templateId": "welcome-email",
    "params": {
      "userName": "John Doe",
      "companyName": "Acme Corp",
      "activationLink": "https://example.com/activate/abc123"
    },
    "to": "john.doe@example.com"
  }'
```

## Query Logs

```bash
# Get all logs
curl -H "x-api-token: your-api-token" \
     "http://localhost:3000/api/v1/logs"

# Filter by status and recipient
curl -H "x-api-token: your-api-token" \
     "http://localhost:3000/api/v1/logs?status=success&to=john.doe@example.com&limit=10"

# Filter by date range
curl -H "x-api-token: your-api-token" \
     "http://localhost:3000/api/v1/logs?start=2024-01-01T00:00:00Z&end=2024-12-31T23:59:59Z"
```

## Check SMTP Connection

```bash
curl -H "x-api-token: your-api-token" \
     http://localhost:3000/api/v1/smtp-check
```

## Health Check (No Auth Required)

```bash
curl http://localhost:3000/health
```