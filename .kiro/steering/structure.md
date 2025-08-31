# Project Structure

## Root Directory
```
├── .env                    # Environment configuration (not in git)
├── .env-example           # Environment template
├── docker-compose.yml     # Docker services configuration
├── package.json           # Node.js dependencies and scripts
└── README.md             # Comprehensive project documentation
```

## Source Code Organization (`src/`)
```
src/
├── app.js                 # Main application entry point
├── swagger-new.js         # Swagger/OpenAPI documentation setup
├── middleware/
│   └── auth.js           # Token authentication middleware
├── routes/               # API route handlers
│   ├── email.js         # Email sending endpoints
│   ├── logs.js          # Email logging endpoints
│   └── templates.js     # Template CRUD endpoints
└── services/            # Business logic layer
    ├── db.js           # Database connection and queries
    ├── logger.js       # Email event logging service
    ├── mailer.js       # SMTP email sending service
    └── templates.js    # Template management service
```

## Data Directory (`data/`)
```
data/
├── logs/
│   └── email.log        # JSONL format email event logs (filesystem mode)
└── templates/           # JSON template files (filesystem mode)
    └── *.json          # Individual template files
```

## Architecture Patterns

### Layered Architecture
- **Routes**: Handle HTTP requests, validation, and responses
- **Services**: Business logic and data operations
- **Middleware**: Cross-cutting concerns (auth, logging, security)

### Configuration Management
- Environment variables for all configuration
- Graceful fallbacks and defaults
- Dual backend support (filesystem/PostgreSQL)

### File Naming Conventions
- Kebab-case for directories and files
- ES module imports with `.js` extensions
- Service files named by domain (mailer, logger, templates)
- Route files named by API resource

### Code Organization Principles
- Single responsibility per service
- Dependency injection pattern for database connections
- Error handling with proper HTTP status codes
- Async/await for all asynchronous operations

### API Structure
```
/health                    # Health check (public)
/docs                     # Swagger UI (public)
/api/v1/send-email        # Send individual email
/api/v1/send-template     # Send templated email
/api/v1/smtp-check        # SMTP connectivity test
/api/v1/logs              # Query email logs
/api/v1/templates         # Template CRUD operations
```

### Database Schema (PostgreSQL mode)
- `email_logs`: Event logging with JSONB metadata
- `email_templates`: Template storage with Handlebars content
- Automatic table creation and migration on startup