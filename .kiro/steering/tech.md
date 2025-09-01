# Technology Stack

## Runtime & Framework
- **Node.js**: 18+ (ES modules enabled with `"type": "module"`)
- **Express.js**: 4.x web framework
- **Nodemailer**: 6.x for SMTP email sending

## Key Dependencies
- **joi**: Schema validation for API requests
- **handlebars**: Template engine for dynamic email content
- **helmet**: Security middleware
- **cors**: Cross-origin resource sharing
- **express-rate-limit**: API rate limiting
- **morgan**: HTTP request logging
- **pg**: PostgreSQL client
- **joi**: Schema validation for API requests

## Development Tools
- **nodemon**: Development server with auto-reload
- **dotenv**: Environment variable management

## Storage Options
- **Filesystem**: Default backend (JSONL logs, JSON templates)
- **PostgreSQL**: Optional backend with automatic migration

## Build & Development Commands

### Local Development
```bash
# Install dependencies
npm install

# Development with auto-reload
npm run dev

# Production start
npm start

# Lint (placeholder - not configured)
npm run lint
```

### Docker Development
```bash
# Start with PostgreSQL
docker compose up -d

# View logs
docker compose logs -f ms_smtp

# Stop services
docker compose down
```

### Environment Setup
```bash
# Copy example environment
cp .env.example .env

# Edit configuration
# Required: API_TOKEN, SMTP_HOST, SMTP_PORT
```

## Configuration Patterns
- Environment-based configuration via `.env` files
- Automatic port fallback (starts at PORT, tries next if occupied)
- Boolean environment variables: `true/false`, `1/0`, `yes/no`, `y/n`, `on/off`
- Graceful fallback from PostgreSQL to filesystem if DB connection fails

## API Standards
- RESTful endpoints under `/api/v1/`
- Token authentication via `x-api-token` header
- JSON request/response format
- Health check at `/health`