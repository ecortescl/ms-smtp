import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ms-smtp - SMTP Microservice API',
      version: '1.0.0',
      description: 'A Node.js microservice for sending emails via SMTP with API authentication and template support.',
      contact: {
        name: 'API Support',
        email: 'support@example.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'https://api.example.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        ApiTokenAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-token',
          description: 'API token for authentication'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error type'
            },
            message: {
              type: 'string',
              description: 'Error message'
            },
            details: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Validation error details'
            }
          }
        },
        EmailAddress: {
          type: 'string',
          format: 'email',
          example: 'user@example.com'
        },
        EmailAddressList: {
          oneOf: [
            { $ref: '#/components/schemas/EmailAddress' },
            {
              type: 'array',
              items: { $ref: '#/components/schemas/EmailAddress' }
            }
          ]
        },
        Attachment: {
          type: 'object',
          properties: {
            filename: {
              type: 'string',
              description: 'Name of the attachment file'
            },
            content: {
              type: 'string',
              description: 'Base64 encoded content or plain text'
            },
            contentType: {
              type: 'string',
              description: 'MIME type of the attachment'
            },
            encoding: {
              type: 'string',
              description: 'Content encoding (base64, etc.)'
            },
            path: {
              type: 'string',
              format: 'uri',
              description: 'URL path to the attachment'
            }
          },
          anyOf: [
            { required: ['content'] },
            { required: ['path'] }
          ]
        },
        EmailRequest: {
          type: 'object',
          required: ['html'],
          properties: {
            from: { $ref: '#/components/schemas/EmailAddress' },
            to: { $ref: '#/components/schemas/EmailAddressList' },
            cc: { $ref: '#/components/schemas/EmailAddressList' },
            bcc: { $ref: '#/components/schemas/EmailAddressList' },
            subject: {
              type: 'string',
              description: 'Email subject line'
            },
            html: {
              type: 'string',
              description: 'HTML content of the email'
            },
            text: {
              type: 'string',
              description: 'Plain text content of the email'
            },
            replyTo: { $ref: '#/components/schemas/EmailAddress' },
            attachments: {
              type: 'array',
              items: { $ref: '#/components/schemas/Attachment' }
            }
          }
        },
        EmailResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['queued'],
              description: 'Email status'
            },
            result: {
              type: 'object',
              properties: {
                accepted: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Accepted email addresses'
                },
                rejected: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Rejected email addresses'
                },
                messageId: {
                  type: 'string',
                  description: 'Unique message identifier'
                },
                response: {
                  type: 'string',
                  description: 'SMTP server response'
                }
              }
            }
          }
        },
        SMTPCheckResponse: {
          type: 'object',
          properties: {
            ok: {
              type: 'boolean',
              description: 'Connection status'
            },
            verified: {
              type: 'boolean',
              description: 'SMTP verification status'
            },
            host: {
              type: 'string',
              description: 'SMTP server host'
            },
            port: {
              type: 'integer',
              description: 'SMTP server port'
            },
            secure: {
              type: 'boolean',
              description: 'Whether connection uses TLS'
            },
            error: {
              type: 'string',
              description: 'Error message if connection failed'
            }
          }
        },
        LogEntry: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique log entry identifier'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'When the event occurred'
            },
            status: {
              type: 'string',
              enum: ['success', 'failed', 'canceled', 'spam', 'queued', 'other'],
              description: 'Email delivery status'
            },
            to: {
              oneOf: [
                { type: 'string' },
                { type: 'array', items: { type: 'string' } }
              ],
              description: 'Recipient email addresses'
            },
            from: {
              type: 'string',
              description: 'Sender email address'
            },
            subject: {
              type: 'string',
              description: 'Email subject'
            },
            provider: {
              type: 'string',
              description: 'Email provider used'
            },
            response: {
              type: 'string',
              description: 'Server response'
            },
            error: {
              type: 'string',
              description: 'Error message if failed'
            },
            meta: {
              type: 'object',
              description: 'Additional metadata'
            }
          }
        },
        LogsResponse: {
          type: 'object',
          properties: {
            logs: {
              type: 'array',
              items: { $ref: '#/components/schemas/LogEntry' }
            },
            total: {
              type: 'integer',
              description: 'Total number of logs matching criteria'
            },
            limit: {
              type: 'integer',
              description: 'Number of logs returned'
            },
            offset: {
              type: 'integer',
              description: 'Offset used for pagination'
            }
          }
        },
        Template: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Unique template identifier'
            },
            name: {
              type: 'string',
              description: 'Template display name'
            },
            subject: {
              type: 'string',
              description: 'Email subject template (supports Handlebars)'
            },
            html: {
              type: 'string',
              description: 'HTML content template (supports Handlebars)'
            },
            defaults: {
              type: 'object',
              description: 'Default values for email fields'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Template creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Template last update timestamp'
            }
          }
        },
        CreateTemplateRequest: {
          type: 'object',
          required: ['name', 'subject', 'html'],
          properties: {
            id: {
              type: 'string',
              pattern: '^[a-zA-Z0-9]{3,64}$',
              description: 'Optional custom template ID (alphanumeric, 3-64 chars)'
            },
            name: {
              type: 'string',
              minLength: 1,
              description: 'Template display name'
            },
            subject: {
              type: 'string',
              description: 'Email subject template (supports Handlebars)'
            },
            html: {
              type: 'string',
              description: 'HTML content template (supports Handlebars)'
            },
            defaults: {
              type: 'object',
              properties: {
                from: { $ref: '#/components/schemas/EmailAddress' },
                to: { $ref: '#/components/schemas/EmailAddressList' },
                cc: { $ref: '#/components/schemas/EmailAddressList' },
                bcc: { $ref: '#/components/schemas/EmailAddressList' },
                replyTo: { $ref: '#/components/schemas/EmailAddress' }
              },
              additionalProperties: true,
              description: 'Default values for template variables and email fields'
            }
          }
        },
        UpdateTemplateRequest: {
          type: 'object',
          minProperties: 1,
          properties: {
            name: {
              type: 'string',
              minLength: 1,
              description: 'Template display name'
            },
            subject: {
              type: 'string',
              description: 'Email subject template (supports Handlebars)'
            },
            html: {
              type: 'string',
              description: 'HTML content template (supports Handlebars)'
            },
            defaults: {
              type: 'object',
              additionalProperties: true,
              description: 'Default values for template variables and email fields'
            }
          }
        },
        SendTemplateRequest: {
          type: 'object',
          required: ['templateId'],
          properties: {
            templateId: {
              type: 'string',
              description: 'ID of the template to use'
            },
            params: {
              type: 'object',
              additionalProperties: true,
              description: 'Parameters for template rendering'
            },
            from: { $ref: '#/components/schemas/EmailAddress' },
            to: { $ref: '#/components/schemas/EmailAddressList' },
            cc: { $ref: '#/components/schemas/EmailAddressList' },
            bcc: { $ref: '#/components/schemas/EmailAddressList' },
            replyTo: { $ref: '#/components/schemas/EmailAddress' },
            attachments: {
              type: 'array',
              items: { $ref: '#/components/schemas/Attachment' }
            }
          }
        },
        HealthResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['ok'],
              description: 'Service health status'
            },
            uptime: {
              type: 'number',
              description: 'Service uptime in seconds'
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Health',
        description: 'Service health and status endpoints'
      },
      {
        name: 'Email',
        description: 'Email sending and SMTP operations'
      },
      {
        name: 'Templates',
        description: 'Email template management and template-based sending'
      },
      {
        name: 'Logs',
        description: 'Email delivery logging and querying'
      }
    ],
    security: [
      {
        ApiTokenAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.js', './src/app.js']
};

const specs = swaggerJsdoc(options);

export { specs, swaggerUi };