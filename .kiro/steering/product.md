# Product Overview

## ms-smtp - SMTP Microservice

A Node.js microservice for sending emails via SMTP with API authentication and template support.

### Core Features
- Email sending via SMTP with token-based authentication (`x-api-token`)
- Template system with Handlebars for dynamic email content
- Email event logging with query capabilities (success/failed/canceled/spam)
- Interactive API documentation with Swagger UI at `/docs`
- Dual storage backends: filesystem (default) or PostgreSQL
- SMTP connectivity verification endpoint
- Health check endpoint for monitoring

### Key Use Cases
- Transactional email sending (welcome emails, notifications, etc.)
- Template-based email campaigns
- Email delivery tracking and logging
- Integration with existing applications via REST API

### Architecture
- RESTful API with Express.js
- Nodemailer for SMTP integration
- Optional PostgreSQL backend with automatic filesystem fallback
- Docker-ready with compose configuration
- Nginx-compatible for production deployment

### Security
- Token-based API authentication
- Rate limiting (100 requests per 15 minutes by default)
- Helmet security headers
- CORS configuration
- TLS/STARTTLS support for SMTP