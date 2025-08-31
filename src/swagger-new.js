import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

/**
 * Configura Swagger UI para la documentación completa de la API
 * @param {import('express').Application} app - Instancia de la aplicación Express
 */
export function setupSwagger(app) {
  const swaggerPath = process.env.SWAGGER_PATH || '/docs';
  
  // Configuración completa de OpenAPI 3.0.3
  const swaggerDefinition = {
    openapi: '3.0.3',
    info: {
      title: 'SMTP Microservice API',
      version: '1.0.0',
      description: `
# Microservicio SMTP para Envío de Correos

API RESTful para el envío de correos electrónicos a través de SMTP con soporte para:
- Envío directo de correos con contenido HTML/texto
- Sistema de plantillas con Handlebars
- Registro y consulta de eventos de envío
- Verificación de conectividad SMTP
- Autenticación por token API

## Autenticación
Todos los endpoints (excepto /health y /docs) requieren el header \`x-api-token\` con un token válido.

## Formatos de Respuesta
- **202 Accepted**: Email enviado exitosamente (queued)
- **400 Bad Request**: Error de validación en los datos
- **401 Unauthorized**: Token inválido o faltante
- **404 Not Found**: Recurso no encontrado
- **409 Conflict**: Conflicto (ej: template ya existe)
- **502 Bad Gateway**: Error del servidor SMTP

## Estados de Email
- **success**: Enviado exitosamente
- **failed**: Error en el envío
- **queued**: En cola de envío
- **canceled**: Cancelado manualmente
- **spam**: Marcado como spam
- **other**: Otro estado personalizado
      `,
      contact: {
        name: 'Soporte Técnico',
        email: 'soporte@eCortes.cl',
        url: 'https://eCortes.cl'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:3000',
        description: process.env.NODE_ENV === 'production' ? 'Servidor de Producción' : 'Servidor de Desarrollo'
      }
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-token',
          description: 'Token de autenticación requerido para acceder a todos los endpoints de la API'
        }
      },
      schemas: {
        // Esquemas de Email
        EmailAddress: {
          type: 'string',
          format: 'email',
          example: 'usuario@ejemplo.com',
          description: 'Dirección de correo electrónico válida'
        },
        EmailAddressList: {
          oneOf: [
            { $ref: '#/components/schemas/EmailAddress' },
            {
              type: 'array',
              items: { $ref: '#/components/schemas/EmailAddress' },
              example: ['usuario1@ejemplo.com', 'usuario2@ejemplo.com']
            }
          ],
          description: 'Una dirección de email o lista de direcciones'
        },
        Attachment: {
          type: 'object',
          properties: {
            filename: {
              type: 'string',
              example: 'documento.pdf',
              description: 'Nombre del archivo adjunto'
            },
            content: {
              type: 'string',
              format: 'base64',
              example: 'JVBERi0xLjQKJcOkw7zDtsO...',
              description: 'Contenido del archivo en base64 (alternativo a path)'
            },
            contentType: {
              type: 'string',
              example: 'application/pdf',
              description: 'Tipo MIME del archivo'
            },
            encoding: {
              type: 'string',
              example: 'base64',
              description: 'Codificación del contenido'
            },
            path: {
              type: 'string',
              format: 'uri',
              example: 'https://ejemplo.com/archivo.pdf',
              description: 'URL del archivo (alternativo a content)'
            }
          },
          oneOf: [
            { required: ['content'] },
            { required: ['path'] }
          ],
          description: 'Archivo adjunto con contenido base64 o URL'
        },
        
        // Esquemas de Request
        SendEmailRequest: {
          type: 'object',
          required: ['to', 'html'],
          properties: {
            from: {
              $ref: '#/components/schemas/EmailAddress',
              description: 'Remitente (opcional, usa SMTP_FROM_DEFAULT si no se especifica)'
            },
            to: {
              $ref: '#/components/schemas/EmailAddressList',
              description: 'Destinatarios principales (requerido)'
            },
            cc: {
              $ref: '#/components/schemas/EmailAddressList',
              description: 'Destinatarios en copia'
            },
            bcc: {
              $ref: '#/components/schemas/EmailAddressList',
              description: 'Destinatarios en copia oculta'
            },
            subject: {
              type: 'string',
              example: 'Asunto del correo',
              description: 'Asunto del email'
            },
            html: {
              type: 'string',
              example: '<h1>Hola</h1><p>Este es un <strong>correo de prueba</strong></p>',
              description: 'Contenido HTML del email (requerido)'
            },
            text: {
              type: 'string',
              example: 'Hola\n\nEste es un correo de prueba',
              description: 'Versión en texto plano del email'
            },
            replyTo: {
              $ref: '#/components/schemas/EmailAddress',
              description: 'Dirección para respuestas'
            },
            attachments: {
              type: 'array',
              items: { $ref: '#/components/schemas/Attachment' },
              description: 'Lista de archivos adjuntos'
            }
          },
          example: {
            from: 'remitente@ejemplo.com',
            to: ['destinatario@ejemplo.com'],
            cc: 'copia@ejemplo.com',
            subject: 'Correo de Bienvenida',
            html: '<h1>¡Bienvenido!</h1><p>Gracias por registrarte en nuestro servicio.</p>',
            text: '¡Bienvenido!\n\nGracias por registrarte en nuestro servicio.',
            replyTo: 'soporte@ejemplo.com'
          }
        },
        
        SendTemplateRequest: {
          type: 'object',
          required: ['templateId'],
          properties: {
            templateId: {
              type: 'string',
              example: 'bienvenida',
              description: 'ID de la plantilla a utilizar'
            },
            params: {
              type: 'object',
              additionalProperties: true,
              example: {
                firstName: 'Juan',
                lastName: 'Pérez',
                company: 'Mi Empresa',
                activationUrl: 'https://ejemplo.com/activate/123'
              },
              description: 'Parámetros para reemplazar en la plantilla'
            },
            from: {
              $ref: '#/components/schemas/EmailAddress',
              description: 'Sobrescribe el remitente de la plantilla'
            },
            to: {
              $ref: '#/components/schemas/EmailAddressList',
              description: 'Sobrescribe los destinatarios de la plantilla'
            },
            cc: {
              $ref: '#/components/schemas/EmailAddressList'
            },
            bcc: {
              $ref: '#/components/schemas/EmailAddressList'
            },
            replyTo: {
              $ref: '#/components/schemas/EmailAddress'
            },
            attachments: {
              type: 'array',
              items: { $ref: '#/components/schemas/Attachment' }
            }
          }
        },
        
        // Esquemas de Template
        Template: {
          type: 'object',
          required: ['name', 'subject', 'html'],
          properties: {
            id: {
              type: 'string',
              pattern: '^[a-zA-Z0-9]{3,64}$',
              example: 'bienvenida',
              description: 'ID único de la plantilla (alfanumérico, 3-64 caracteres)'
            },
            name: {
              type: 'string',
              minLength: 1,
              example: 'Email de Bienvenida',
              description: 'Nombre descriptivo de la plantilla'
            },
            subject: {
              type: 'string',
              example: 'Bienvenido {{firstName}} a {{company}}',
              description: 'Asunto con variables Handlebars'
            },
            html: {
              type: 'string',
              example: '<h1>Hola {{firstName}}</h1><p>Bienvenido a <strong>{{company}}</strong></p>',
              description: 'Contenido HTML con variables Handlebars'
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
              example: {
                from: 'no-reply@ejemplo.com',
                replyTo: 'soporte@ejemplo.com'
              },
              description: 'Valores por defecto para la plantilla'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T10:30:00Z',
              description: 'Fecha de creación'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-20T15:45:00Z',
              description: 'Fecha de última actualización'
            }
          }
        },
        
        TemplateUpdate: {
          type: 'object',
          minProperties: 1,
          properties: {
            name: {
              type: 'string',
              minLength: 1,
              example: 'Email de Bienvenida Actualizado'
            },
            subject: {
              type: 'string',
              example: '¡Hola {{firstName}}! Bienvenido a {{company}}'
            },
            html: {
              type: 'string',
              example: '<div><h1>¡Hola {{firstName}}!</h1><p>Te damos la bienvenida a <strong>{{company}}</strong></p></div>'
            },
            defaults: {
              type: 'object',
              additionalProperties: true
            }
          }
        },
        
        // Esquemas de Logs
        EmailLog: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
              description: 'ID único del evento'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T10:30:00Z',
              description: 'Fecha y hora del evento'
            },
            status: {
              type: 'string',
              enum: ['success', 'failed', 'canceled', 'spam', 'queued', 'other'],
              example: 'success',
              description: 'Estado del envío'
            },
            to: {
              type: 'string',
              example: 'destinatario@ejemplo.com',
              description: 'Destinatario del email'
            },
            from: {
              type: 'string',
              example: 'remitente@ejemplo.com',
              description: 'Remitente del email'
            },
            subject: {
              type: 'string',
              example: 'Correo de Bienvenida',
              description: 'Asunto del email'
            },
            provider: {
              type: 'string',
              example: 'smtp',
              description: 'Proveedor de envío'
            },
            response: {
              type: 'string',
              example: '250 2.0.0 Ok: queued as 12345',
              description: 'Respuesta del servidor SMTP'
            },
            error: {
              type: 'string',
              example: 'Connection timeout',
              description: 'Mensaje de error si falló'
            },
            meta: {
              type: 'object',
              additionalProperties: true,
              example: {
                messageId: '<123@ejemplo.com>',
                templateId: 'bienvenida',
                accepted: ['destinatario@ejemplo.com'],
                rejected: []
              },
              description: 'Metadatos adicionales del evento'
            }
          }
        },
        
        LogsResponse: {
          type: 'object',
          properties: {
            total: {
              type: 'integer',
              example: 150,
              description: 'Total de registros que coinciden con los filtros'
            },
            offset: {
              type: 'integer',
              example: 0,
              description: 'Desplazamiento de la paginación'
            },
            limit: {
              type: 'integer',
              example: 50,
              description: 'Límite de registros por página'
            },
            items: {
              type: 'array',
              items: { $ref: '#/components/schemas/EmailLog' },
              description: 'Lista de eventos de email'
            }
          }
        },
        
        CreateLogRequest: {
          type: 'object',
          required: ['status'],
          properties: {
            status: {
              type: 'string',
              enum: ['success', 'failed', 'canceled', 'spam', 'queued', 'other'],
              example: 'canceled',
              description: 'Estado del evento a registrar'
            },
            to: {
              $ref: '#/components/schemas/EmailAddressList',
              description: 'Destinatario(s) del email'
            },
            from: {
              type: 'string',
              example: 'sistema@ejemplo.com',
              description: 'Remitente del email'
            },
            subject: {
              type: 'string',
              example: 'Campaña Marketing Q1',
              description: 'Asunto del email'
            },
            provider: {
              type: 'string',
              default: 'smtp',
              example: 'smtp',
              description: 'Proveedor de envío'
            },
            response: {
              type: 'string',
              example: 'User requested cancellation',
              description: 'Respuesta o mensaje del evento'
            },
            error: {
              type: 'string',
              example: 'Spam filter triggered',
              description: 'Mensaje de error si aplica'
            },
            meta: {
              type: 'object',
              additionalProperties: true,
              example: {
                reason: 'Usuario solicitó cancelación',
                campaignId: 'camp_123'
              },
              description: 'Metadatos adicionales'
            }
          }
        },
        
        // Esquemas de Response
        EmailSentResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'queued',
              description: 'Estado del envío'
            },
            result: {
              type: 'object',
              properties: {
                messageId: {
                  type: 'string',
                  example: '<123456789@ejemplo.com>',
                  description: 'ID único del mensaje'
                },
                accepted: {
                  type: 'array',
                  items: { type: 'string' },
                  example: ['destinatario@ejemplo.com'],
                  description: 'Direcciones aceptadas por el servidor'
                },
                rejected: {
                  type: 'array',
                  items: { type: 'string' },
                  example: [],
                  description: 'Direcciones rechazadas por el servidor'
                },
                response: {
                  type: 'string',
                  example: '250 2.0.0 Ok: queued as 12345',
                  description: 'Respuesta del servidor SMTP'
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
              example: true,
              description: 'Indica si la verificación fue exitosa'
            },
            verified: {
              type: 'boolean',
              example: true,
              description: 'Estado de verificación del servidor SMTP'
            },
            host: {
              type: 'string',
              example: 'smtp.gmail.com',
              description: 'Host del servidor SMTP'
            },
            port: {
              type: 'integer',
              example: 587,
              description: 'Puerto del servidor SMTP'
            },
            secure: {
              type: 'boolean',
              example: false,
              description: 'Si usa conexión segura (TLS implícito)'
            }
          }
        },
        
        HealthResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              example: 'ok',
              description: 'Estado del servicio'
            },
            uptime: {
              type: 'number',
              example: 3600.5,
              description: 'Tiempo de actividad en segundos'
            }
          }
        },
        
        // Esquemas de Error
        ValidationError: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              example: 'ValidationError',
              description: 'Tipo de error'
            },
            details: {
              type: 'array',
              items: { type: 'string' },
              example: ['"to" is required', '"html" is required'],
              description: 'Lista de errores de validación'
            }
          }
        },
        
        UnauthorizedError: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              example: 'Unauthorized: invalid or missing x-api-token',
              description: 'Mensaje de error de autenticación'
            }
          }
        },
        
        SMTPError: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              example: 'SMTPError',
              description: 'Tipo de error'
            },
            message: {
              type: 'string',
              example: 'Connection timeout to SMTP server',
              description: 'Descripción del error SMTP'
            }
          }
        },
        
        NotFoundError: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              example: 'NotFound',
              description: 'Tipo de error'
            },
            message: {
              type: 'string',
              example: 'Template with id "inexistente" not found',
              description: 'Descripción del error'
            }
          }
        }
      },
      
      responses: {
        UnauthorizedError: {
          description: 'Token de API inválido o no proporcionado',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UnauthorizedError' }
            }
          }
        },
        ValidationError: {
          description: 'Error de validación en los datos enviados',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ValidationError' }
            }
          }
        },
        SMTPError: {
          description: 'Error del servidor SMTP',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SMTPError' }
            }
          }
        },
        NotFoundError: {
          description: 'Recurso no encontrado',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/NotFoundError' }
            }
          }
        }
      }
    },
    
    paths: {
      '/health': {
        get: {
          tags: ['Sistema'],
          summary: 'Verificar estado del servicio',
          description: 'Endpoint público para verificar que el servicio está funcionando correctamente',
          operationId: 'healthCheck',
          responses: {
            '200': {
              description: 'Servicio funcionando correctamente',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/HealthResponse' }
                }
              }
            }
          }
        }
      },
      
      '/api/v1/send-email': {
        post: {
          tags: ['Envío de Emails'],
          summary: 'Enviar email directo',
          description: `
Envía un email directamente con contenido HTML/texto especificado.

**Validaciones:**
- Al menos un destinatario requerido (to, cc, o bcc)
- Contenido HTML es obligatorio
- Direcciones de email deben ser válidas
- Adjuntos pueden ser base64 o URLs

**Logging automático:**
- Se registra automáticamente el resultado (success/failed)
- Incluye metadatos como messageId, accepted, rejected
          `,
          operationId: 'sendEmail',
          security: [{ ApiKeyAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SendEmailRequest' },
                examples: {
                  simple: {
                    summary: 'Email simple',
                    value: {
                      to: 'usuario@ejemplo.com',
                      subject: 'Hola desde la API',
                      html: '<h1>¡Hola!</h1><p>Este es un mensaje de prueba.</p>'
                    }
                  },
                  complete: {
                    summary: 'Email completo con adjuntos',
                    value: {
                      from: 'remitente@ejemplo.com',
                      to: ['usuario1@ejemplo.com', 'usuario2@ejemplo.com'],
                      cc: 'supervisor@ejemplo.com',
                      bcc: 'auditoria@ejemplo.com',
                      subject: 'Reporte Mensual',
                      html: '<h1>Reporte Mensual</h1><p>Adjunto encontrarás el reporte del mes.</p>',
                      text: 'Reporte Mensual\n\nAdjunto encontrarás el reporte del mes.',
                      replyTo: 'soporte@ejemplo.com',
                      attachments: [
                        {
                          filename: 'reporte.pdf',
                          content: 'JVBERi0xLjQKJcOkw7zDtsO...',
                          contentType: 'application/pdf',
                          encoding: 'base64'
                        }
                      ]
                    }
                  }
                }
              }
            }
          },
          responses: {
            '202': {
              description: 'Email enviado exitosamente (en cola)',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/EmailSentResponse' },
                  example: {
                    status: 'queued',
                    result: {
                      messageId: '<123456789@ejemplo.com>',
                      accepted: ['usuario@ejemplo.com'],
                      rejected: [],
                      response: '250 2.0.0 Ok: queued as 12345'
                    }
                  }
                }
              }
            },
            '400': { $ref: '#/components/responses/ValidationError' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '502': { $ref: '#/components/responses/SMTPError' }
          }
        }
      },
      
      '/api/v1/send-template': {
        post: {
          tags: ['Envío de Emails'],
          summary: 'Enviar email desde plantilla',
          description: `
Envía un email utilizando una plantilla predefinida con variables Handlebars.

**Proceso:**
1. Busca la plantilla por ID
2. Renderiza el contenido con los parámetros proporcionados
3. Combina valores por defecto de la plantilla con overrides del request
4. Envía el email y registra el evento

**Variables Handlebars:**
- Usa sintaxis {{variable}} en subject y html
- Soporta helpers básicos de Handlebars
- Los parámetros se pasan en el campo "params"
          `,
          operationId: 'sendTemplate',
          security: [{ ApiKeyAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SendTemplateRequest' },
                examples: {
                  basic: {
                    summary: 'Envío básico con plantilla',
                    value: {
                      templateId: 'bienvenida',
                      params: {
                        firstName: 'Ana',
                        company: 'Mi Empresa'
                      },
                      to: 'ana@ejemplo.com'
                    }
                  },
                  advanced: {
                    summary: 'Envío avanzado con overrides',
                    value: {
                      templateId: 'newsletter',
                      params: {
                        userName: 'Carlos',
                        month: 'Enero',
                        articles: [
                          { title: 'Artículo 1', url: 'https://ejemplo.com/1' },
                          { title: 'Artículo 2', url: 'https://ejemplo.com/2' }
                        ]
                      },
                      to: ['carlos@ejemplo.com', 'maria@ejemplo.com'],
                      from: 'newsletter@ejemplo.com',
                      attachments: [
                        {
                          filename: 'newsletter.pdf',
                          path: 'https://ejemplo.com/newsletter-enero.pdf'
                        }
                      ]
                    }
                  }
                }
              }
            }
          },
          responses: {
            '202': {
              description: 'Email enviado exitosamente desde plantilla',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/EmailSentResponse' }
                }
              }
            },
            '400': { $ref: '#/components/responses/ValidationError' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '404': { $ref: '#/components/responses/NotFoundError' },
            '502': { $ref: '#/components/responses/SMTPError' }
          }
        }
      },
      
      '/api/v1/smtp-check': {
        get: {
          tags: ['Sistema'],
          summary: 'Verificar conectividad SMTP',
          description: `
Verifica la conectividad y configuración del servidor SMTP.

**Verificaciones:**
- Conexión al servidor SMTP
- Autenticación (si está configurada)
- Configuración de puertos y seguridad
- Estado general del transporter

Útil para diagnóstico y monitoreo de la configuración SMTP.
          `,
          operationId: 'smtpCheck',
          security: [{ ApiKeyAuth: [] }],
          responses: {
            '200': {
              description: 'Verificación SMTP exitosa',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/SMTPCheckResponse' },
                  example: {
                    ok: true,
                    verified: true,
                    host: 'smtp.gmail.com',
                    port: 587,
                    secure: false
                  }
                }
              }
            },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '502': {
              description: 'Error de conectividad SMTP',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      ok: { type: 'boolean', example: false },
                      error: { type: 'string', example: 'Connection timeout' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      
      '/api/v1/logs': {
        get: {
          tags: ['Logs y Auditoría'],
          summary: 'Consultar logs de emails',
          description: `
Consulta los eventos de envío de emails con filtros avanzados y paginación.

**Filtros disponibles:**
- **status**: Filtrar por estado (success, failed, canceled, spam, queued, other)
- **to**: Buscar por destinatario (búsqueda parcial)
- **from**: Buscar por remitente (búsqueda parcial)
- **contains**: Buscar en asunto y respuesta (búsqueda parcial)
- **start/end**: Filtrar por rango de fechas
- **limit/offset**: Paginación

**Formato de fechas:** ISO 8601 (ej: 2024-01-15T10:30:00Z)
          `,
          operationId: 'getLogs',
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            {
              name: 'status',
              in: 'query',
              description: 'Filtrar por estado (separar múltiples con comas)',
              schema: {
                type: 'string',
                example: 'success,failed'
              }
            },
            {
              name: 'to',
              in: 'query',
              description: 'Buscar por destinatario (búsqueda parcial)',
              schema: {
                type: 'string',
                example: 'usuario@ejemplo.com'
              }
            },
            {
              name: 'from',
              in: 'query',
              description: 'Buscar por remitente (búsqueda parcial)',
              schema: {
                type: 'string',
                example: 'sistema@ejemplo.com'
              }
            },
            {
              name: 'contains',
              in: 'query',
              description: 'Buscar en asunto y respuesta',
              schema: {
                type: 'string',
                example: 'bienvenida'
              }
            },
            {
              name: 'start',
              in: 'query',
              description: 'Fecha de inicio (ISO 8601)',
              schema: {
                type: 'string',
                format: 'date-time',
                example: '2024-01-01T00:00:00Z'
              }
            },
            {
              name: 'end',
              in: 'query',
              description: 'Fecha de fin (ISO 8601)',
              schema: {
                type: 'string',
                format: 'date-time',
                example: '2024-01-31T23:59:59Z'
              }
            },
            {
              name: 'limit',
              in: 'query',
              description: 'Número máximo de registros (default: 100)',
              schema: {
                type: 'integer',
                minimum: 1,
                maximum: 1000,
                default: 100,
                example: 50
              }
            },
            {
              name: 'offset',
              in: 'query',
              description: 'Número de registros a omitir (default: 0)',
              schema: {
                type: 'integer',
                minimum: 0,
                default: 0,
                example: 0
              }
            }
          ],
          responses: {
            '200': {
              description: 'Lista de logs de emails',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/LogsResponse' },
                  example: {
                    total: 150,
                    offset: 0,
                    limit: 50,
                    items: [
                      {
                        id: '123e4567-e89b-12d3-a456-426614174000',
                        timestamp: '2024-01-15T10:30:00Z',
                        status: 'success',
                        to: 'usuario@ejemplo.com',
                        from: 'sistema@ejemplo.com',
                        subject: 'Bienvenido a nuestro servicio',
                        provider: 'smtp',
                        response: '250 2.0.0 Ok: queued as 12345',
                        meta: {
                          messageId: '<123@ejemplo.com>',
                          templateId: 'bienvenida',
                          accepted: ['usuario@ejemplo.com'],
                          rejected: []
                        }
                      }
                    ]
                  }
                }
              }
            },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '500': {
              description: 'Error interno del servidor',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      error: { type: 'string', example: 'LogQueryError' },
                      message: { type: 'string', example: 'Database connection failed' }
                    }
                  }
                }
              }
            }
          }
        },
        
        post: {
          tags: ['Logs y Auditoría'],
          summary: 'Registrar evento de email manualmente',
          description: `
Registra manualmente un evento de email en el sistema de logs.

**Casos de uso:**
- Registrar cancelaciones manuales
- Marcar emails como spam desde feedback externo
- Registrar eventos desde otros sistemas
- Auditoría manual de envíos

**Nota:** Los eventos de success/failed se registran automáticamente en los endpoints de envío.
          `,
          operationId: 'createLog',
          security: [{ ApiKeyAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CreateLogRequest' },
                examples: {
                  canceled: {
                    summary: 'Cancelación manual',
                    value: {
                      status: 'canceled',
                      to: 'usuario@ejemplo.com',
                      from: 'sistema@ejemplo.com',
                      subject: 'Campaña Marketing Q1',
                      response: 'Cancelado por solicitud del usuario',
                      meta: {
                        reason: 'Usuario solicitó cancelación',
                        canceledBy: 'admin@ejemplo.com',
                        originalMessageId: '<123@ejemplo.com>'
                      }
                    }
                  },
                  spam: {
                    summary: 'Marcado como spam',
                    value: {
                      status: 'spam',
                      to: 'usuario@ejemplo.com',
                      subject: 'Newsletter Semanal',
                      error: 'Marked as spam by recipient',
                      meta: {
                        spamScore: 8.5,
                        provider: 'gmail',
                        feedbackLoop: true
                      }
                    }
                  }
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Evento registrado exitosamente',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/EmailLog' }
                }
              }
            },
            '400': { $ref: '#/components/responses/ValidationError' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '500': {
              description: 'Error al escribir el log',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      error: { type: 'string', example: 'LogWriteError' },
                      message: { type: 'string', example: 'Failed to write to log file' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      
      '/api/v1/templates': {
        get: {
          tags: ['Plantillas'],
          summary: 'Listar todas las plantillas',
          description: `
Obtiene la lista completa de plantillas de email disponibles.

**Información incluida:**
- ID y nombre de la plantilla
- Contenido del asunto y HTML
- Valores por defecto configurados
- Fechas de creación y actualización
          `,
          operationId: 'getTemplates',
          security: [{ ApiKeyAuth: [] }],
          responses: {
            '200': {
              description: 'Lista de plantillas',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Template' }
                  },
                  example: [
                    {
                      id: 'bienvenida',
                      name: 'Email de Bienvenida',
                      subject: 'Bienvenido {{firstName}} a {{company}}',
                      html: '<h1>Hola {{firstName}}</h1><p>Bienvenido a <strong>{{company}}</strong></p>',
                      defaults: {
                        from: 'no-reply@ejemplo.com',
                        replyTo: 'soporte@ejemplo.com'
                      },
                      createdAt: '2024-01-15T10:30:00Z',
                      updatedAt: '2024-01-20T15:45:00Z'
                    }
                  ]
                }
              }
            },
            '401': { $ref: '#/components/responses/UnauthorizedError' }
          }
        },
        
        post: {
          tags: ['Plantillas'],
          summary: 'Crear nueva plantilla',
          description: `
Crea una nueva plantilla de email con contenido Handlebars.

**Características:**
- ID opcional (se genera automáticamente si no se proporciona)
- Soporte completo para variables Handlebars en subject y html
- Valores por defecto para remitente, destinatarios, etc.
- Validación de sintaxis Handlebars

**Variables Handlebars:**
- Sintaxis: {{variable}}
- Helpers disponibles: if, unless, each, with
- Escapado automático de HTML (usar {{{variable}}} para HTML crudo)
          `,
          operationId: 'createTemplate',
          security: [{ ApiKeyAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Template' },
                examples: {
                  welcome: {
                    summary: 'Plantilla de bienvenida',
                    value: {
                      id: 'bienvenida',
                      name: 'Email de Bienvenida',
                      subject: '¡Bienvenido {{firstName}} a {{company}}!',
                      html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #333;">¡Hola {{firstName}}!</h1>
  <p>Te damos la bienvenida a <strong>{{company}}</strong>.</p>
  <p>Para activar tu cuenta, haz clic en el siguiente enlace:</p>
  <a href="{{activationUrl}}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
    Activar Cuenta
  </a>
  <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
  <p>Saludos,<br>El equipo de {{company}}</p>
</div>
                      `,
                      defaults: {
                        from: 'bienvenida@ejemplo.com',
                        replyTo: 'soporte@ejemplo.com'
                      }
                    }
                  },
                  newsletter: {
                    summary: 'Plantilla de newsletter',
                    value: {
                      id: 'newsletter',
                      name: 'Newsletter Mensual',
                      subject: 'Newsletter {{month}} - {{company}}',
                      html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1>Newsletter de {{month}}</h1>
  <p>Hola {{userName}},</p>
  <p>Aquí tienes las novedades de este mes:</p>
  
  {{#each articles}}
  <div style="border: 1px solid #ddd; padding: 15px; margin: 10px 0;">
    <h3><a href="{{url}}">{{title}}</a></h3>
    <p>{{summary}}</p>
  </div>
  {{/each}}
  
  <p>¡Gracias por suscribirte!</p>
</div>
                      `,
                      defaults: {
                        from: 'newsletter@ejemplo.com'
                      }
                    }
                  }
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Plantilla creada exitosamente',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Template' }
                }
              }
            },
            '400': { $ref: '#/components/responses/ValidationError' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '409': {
              description: 'Plantilla ya existe',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      error: { type: 'string', example: 'Conflict' },
                      message: { type: 'string', example: 'Template with id "bienvenida" already exists' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      
      '/api/v1/templates/{id}': {
        get: {
          tags: ['Plantillas'],
          summary: 'Obtener plantilla por ID',
          description: 'Obtiene los detalles completos de una plantilla específica por su ID.',
          operationId: 'getTemplate',
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'ID único de la plantilla',
              schema: {
                type: 'string',
                example: 'bienvenida'
              }
            }
          ],
          responses: {
            '200': {
              description: 'Detalles de la plantilla',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Template' }
                }
              }
            },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '404': { $ref: '#/components/responses/NotFoundError' }
          }
        },
        
        put: {
          tags: ['Plantillas'],
          summary: 'Actualizar plantilla existente',
          description: `
Actualiza una plantilla existente. Solo se modifican los campos proporcionados.

**Campos actualizables:**
- name: Nombre descriptivo
- subject: Asunto con variables Handlebars
- html: Contenido HTML con variables Handlebars
- defaults: Valores por defecto

**Nota:** El ID de la plantilla no se puede modificar.
          `,
          operationId: 'updateTemplate',
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'ID único de la plantilla a actualizar',
              schema: {
                type: 'string',
                example: 'bienvenida'
              }
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/TemplateUpdate' },
                examples: {
                  updateSubject: {
                    summary: 'Actualizar solo el asunto',
                    value: {
                      subject: '¡Hola {{firstName}}! Bienvenido a {{company}} 🎉'
                    }
                  },
                  updateContent: {
                    summary: 'Actualizar contenido y defaults',
                    value: {
                      html: '<div><h1>¡Hola {{firstName}}!</h1><p>Bienvenido a <strong>{{company}}</strong>. Tu cuenta está lista para usar.</p></div>',
                      defaults: {
                        from: 'bienvenida@ejemplo.com',
                        replyTo: 'soporte@ejemplo.com',
                        bcc: 'auditoria@ejemplo.com'
                      }
                    }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Plantilla actualizada exitosamente',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Template' }
                }
              }
            },
            '400': { $ref: '#/components/responses/ValidationError' },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '404': { $ref: '#/components/responses/NotFoundError' }
          }
        },
        
        delete: {
          tags: ['Plantillas'],
          summary: 'Eliminar plantilla',
          description: `
Elimina permanentemente una plantilla del sistema.

**Advertencia:** Esta acción no se puede deshacer. Asegúrate de que la plantilla no esté siendo utilizada en procesos automatizados.
          `,
          operationId: 'deleteTemplate',
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'ID único de la plantilla a eliminar',
              schema: {
                type: 'string',
                example: 'bienvenida'
              }
            }
          ],
          responses: {
            '204': {
              description: 'Plantilla eliminada exitosamente'
            },
            '401': { $ref: '#/components/responses/UnauthorizedError' },
            '404': { $ref: '#/components/responses/NotFoundError' }
          }
        }
      }
    },
    
    tags: [
      {
        name: 'Sistema',
        description: 'Endpoints de sistema y diagnóstico'
      },
      {
        name: 'Envío de Emails',
        description: 'Endpoints para envío directo y con plantillas'
      },
      {
        name: 'Plantillas',
        description: 'Gestión CRUD de plantillas de email'
      },
      {
        name: 'Logs y Auditoría',
        description: 'Consulta y registro de eventos de email'
      }
    ]
  };

  const specs = swaggerJSDoc({
    definition: swaggerDefinition,
    apis: [] // No necesitamos archivos externos, toda la documentación está aquí
  });

  // Configuración simplificada y funcional de Swagger UI
  const swaggerUiOptions = {
    explorer: true,
    customSiteTitle: 'SMTP Microservice API - Documentación',
    customCss: `
      .swagger-ui .topbar { display: none; }
      .swagger-ui .info .title { 
        font-size: 28px; 
        font-weight: 700; 
        color: #1f2937;
        margin-bottom: 10px;
      }
      .swagger-ui .info .description { 
        font-size: 14px; 
        line-height: 1.6;
        color: #4b5563;
      }
      .swagger-ui .info { 
        margin: 30px 0; 
        padding: 20px;
        background: #f8fafc;
        border-radius: 8px;
        border-left: 4px solid #3b82f6;
      }
      .swagger-ui .scheme-container { 
        margin: 20px 0; 
        padding: 15px; 
        background: #fef3c7; 
        border-radius: 6px;
        border: 1px solid #f59e0b;
      }
      .swagger-ui .opblock.opblock-post { border-color: #059669; }
      .swagger-ui .opblock.opblock-get { border-color: #0ea5e9; }
      .swagger-ui .opblock.opblock-put { border-color: #f59e0b; }
      .swagger-ui .opblock.opblock-delete { border-color: #ef4444; }
    `,
    swaggerOptions: {
      docExpansion: 'list',
      filter: true,
      showRequestDuration: true,
      defaultModelsExpandDepth: 1,
      defaultModelExpandDepth: 1,
      persistAuthorization: true,
      tryItOutEnabled: true,
      validatorUrl: null
    }
  };

  // Montar Swagger UI en la ruta configurada
  app.use(swaggerPath, swaggerUi.serve);
  app.get(swaggerPath, swaggerUi.setup(specs, swaggerUiOptions));

  // Endpoint para obtener la especificación OpenAPI en JSON
  app.get('/openapi.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.json(specs);
  });

  // Endpoint alternativo para compatibilidad
  app.get('/swagger.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.json(specs);
  });

  console.log(`📚 Documentación completa de la API disponible en: ${swaggerPath}`);
  console.log(`📄 Especificación OpenAPI JSON disponible en: /openapi.json`);
}
