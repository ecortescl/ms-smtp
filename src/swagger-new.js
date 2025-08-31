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
# 📧 Microservicio SMTP para Envío de Correos

API RESTful profesional para el envío de correos electrónicos a través de SMTP con funcionalidades avanzadas.

## 🚀 Características Principales
- **Envío directo** de correos con contenido HTML/texto
- **Sistema de plantillas** con Handlebars para emails dinámicos
- **Registro y auditoría** completa de eventos de envío
- **Verificación SMTP** para diagnóstico y monitoreo
- **Autenticación segura** por token API
- **Filtros avanzados** para consulta de logs
- **Adjuntos** con soporte base64 y URLs
- **Fallback automático** entre PostgreSQL y filesystem

## 🔐 Autenticación
Todos los endpoints (excepto \`/health\` y \`/docs\`) requieren el header \`x-api-token\` con un token válido.

**Configuración:**
1. Haz clic en el botón **"Authorize"** 🔓
2. Ingresa tu token API en el campo \`x-api-token\`
3. Haz clic en **"Authorize"** para guardar
4. El token se mantendrá durante toda la sesión

## 📊 Códigos de Respuesta
| Código | Descripción | Uso |
|--------|-------------|-----|
| **200 OK** | Operación exitosa | Consultas, verificaciones |
| **201 Created** | Recurso creado | Plantillas, logs manuales |
| **202 Accepted** | Email en cola | Envíos exitosos |
| **204 No Content** | Eliminación exitosa | Borrar plantillas |
| **400 Bad Request** | Error de validación | Datos incorrectos |
| **401 Unauthorized** | Token inválido | Falta autenticación |
| **404 Not Found** | Recurso no encontrado | Plantilla inexistente |
| **409 Conflict** | Conflicto de recursos | Template duplicado |
| **500 Internal Error** | Error del servidor | Problemas internos |
| **502 Bad Gateway** | Error SMTP | Problemas de conectividad |

## 📈 Estados de Email
| Estado | Descripción | Cuándo se usa |
|--------|-------------|---------------|
| **success** ✅ | Enviado exitosamente | Automático en envío |
| **failed** ❌ | Error en el envío | Automático en error |
| **queued** ⏳ | En cola de envío | Estado inicial |
| **canceled** 🚫 | Cancelado manualmente | Registro manual |
| **spam** 🚨 | Marcado como spam | Feedback externo |
| **other** ℹ️ | Estado personalizado | Casos especiales |

## 🛠️ Guía Rápida de Uso

### 1. Verificar Conectividad
Antes de enviar emails, verifica que el servidor SMTP esté configurado:
\`GET /api/v1/smtp-check\`

### 2. Envío Simple
Para enviar un email básico:
\`POST /api/v1/send-email\`

### 3. Crear Plantilla
Para emails recurrentes, crea una plantilla:
\`POST /api/v1/templates\`

### 4. Envío con Plantilla
Usa plantillas para emails dinámicos:
\`POST /api/v1/send-template\`

### 5. Consultar Logs
Monitorea el estado de tus envíos:
\`GET /api/v1/logs\`

## 📝 Variables Handlebars
Las plantillas soportan variables dinámicas:
- **Sintaxis**: \`{{variable}}\`
- **Condicionales**: \`{{#if condition}}...{{/if}}\`
- **Bucles**: \`{{#each items}}...{{/each}}\`
- **HTML seguro**: \`{{{htmlContent}}}\` (sin escapar)

## 🔍 Filtros de Logs
Consulta logs con filtros avanzados:
- **Por estado**: \`?status=success,failed\`
- **Por destinatario**: \`?to=usuario@ejemplo.com\`
- **Por fecha**: \`?start=2024-01-01T00:00:00Z&end=2024-01-31T23:59:59Z\`
- **Por contenido**: \`?contains=bienvenida\`
- **Paginación**: \`?limit=50&offset=0\`

## 📚 Recursos Adicionales
- **Ejemplos de código**: Ver sección de ejemplos en cada endpoint
- **Esquemas detallados**: Expandir modelos para ver estructura completa
- **Casos de prueba**: Usar "Try it out" para probar en vivo
- **Documentación externa**: Consultar README.md del proyecto

## ⚡ Consejos de Rendimiento
- Usa plantillas para emails recurrentes
- Implementa paginación en consultas de logs
- Configura límites de rate limiting apropiados
- Monitorea logs regularmente para detectar problemas

## 🆘 Solución de Problemas
1. **Error 401**: Verifica que el token API esté configurado correctamente
2. **Error 502**: Revisa la configuración SMTP con \`/smtp-check\`
3. **Plantilla no encontrada**: Verifica el ID con \`GET /templates\`
4. **Validación fallida**: Revisa los esquemas de cada endpoint
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
        // Esquemas básicos
        EmailAddress: {
          type: 'string',
          format: 'email',
          example: 'usuario@ejemplo.com',
          description: 'Dirección de correo electrónico válida'
        },
        
        // Esquemas de Request
        SendEmailRequest: {
          type: 'object',
          required: ['to', 'html'],
          properties: {
            from: {
              type: 'string',
              format: 'email',
              description: 'Remitente (opcional, usa SMTP_FROM_DEFAULT si no se especifica)',
              example: 'remitente@ejemplo.com'
            },
            to: {
              oneOf: [
                { type: 'string', format: 'email' },
                { type: 'array', items: { type: 'string', format: 'email' } }
              ],
              description: 'Destinatarios principales (requerido)',
              example: ['destinatario@ejemplo.com']
            },
            cc: {
              oneOf: [
                { type: 'string', format: 'email' },
                { type: 'array', items: { type: 'string', format: 'email' } }
              ],
              description: 'Destinatarios en copia',
              example: 'copia@ejemplo.com'
            },
            bcc: {
              oneOf: [
                { type: 'string', format: 'email' },
                { type: 'array', items: { type: 'string', format: 'email' } }
              ],
              description: 'Destinatarios en copia oculta',
              example: ['oculto@ejemplo.com']
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
              example: 'Hola\\n\\nEste es un correo de prueba',
              description: 'Versión en texto plano del email'
            },
            replyTo: {
              type: 'string',
              format: 'email',
              description: 'Dirección para respuestas',
              example: 'soporte@ejemplo.com'
            },
            attachments: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  filename: { type: 'string', example: 'documento.pdf' },
                  content: { type: 'string', example: 'JVBERi0xLjQKJcOkw7zDtsO...' },
                  contentType: { type: 'string', example: 'application/pdf' },
                  encoding: { type: 'string', example: 'base64' },
                  path: { type: 'string', example: 'https://ejemplo.com/archivo.pdf' }
                }
              },
              description: 'Lista de archivos adjuntos'
            }
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
              type: 'string',
              format: 'email',
              description: 'Sobrescribe el remitente de la plantilla',
              example: 'remitente@ejemplo.com'
            },
            to: {
              oneOf: [
                { type: 'string', format: 'email' },
                { type: 'array', items: { type: 'string', format: 'email' } }
              ],
              description: 'Sobrescribe los destinatarios de la plantilla',
              example: ['destinatario@ejemplo.com']
            },
            cc: {
              oneOf: [
                { type: 'string', format: 'email' },
                { type: 'array', items: { type: 'string', format: 'email' } }
              ]
            },
            bcc: {
              oneOf: [
                { type: 'string', format: 'email' },
                { type: 'array', items: { type: 'string', format: 'email' } }
              ]
            },
            replyTo: {
              type: 'string',
              format: 'email'
            },
            attachments: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  filename: { type: 'string' },
                  content: { type: 'string' },
                  contentType: { type: 'string' },
                  encoding: { type: 'string' },
                  path: { type: 'string' }
                }
              }
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
          description: 'Envía un email directamente con contenido HTML/texto especificado. Al menos un destinatario requerido (to, cc, o bcc). Contenido HTML es obligatorio.',
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
                      text: 'Reporte Mensual\\n\\nAdjunto encontrarás el reporte del mes.',
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
                  schema: { $ref: '#/components/schemas/EmailSentResponse' }
                }
              }
            },
            '400': {
              description: 'Error de validación',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ValidationError' }
                }
              }
            },
            '401': {
              description: 'No autorizado',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/UnauthorizedError' }
                }
              }
            },
            '502': {
              description: 'Error SMTP',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/SMTPError' }
                }
              }
            }
          }
        }
      },
      
      '/api/v1/send-template': {
        post: {
          tags: ['Envío de Emails'],
          summary: 'Enviar email desde plantilla',
          description: 'Envía un email utilizando una plantilla predefinida con variables Handlebars. Busca la plantilla por ID, renderiza el contenido con los parámetros proporcionados y envía el email.',
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
            '400': {
              description: 'Error de validación',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ValidationError' }
                }
              }
            },
            '401': {
              description: 'No autorizado',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/UnauthorizedError' }
                }
              }
            },
            '404': {
              description: 'Plantilla no encontrada',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/NotFoundError' }
                }
              }
            },
            '502': {
              description: 'Error SMTP',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/SMTPError' }
                }
              }
            }
          }
        }
      },
      
      '/api/v1/smtp-check': {
        get: {
          tags: ['Sistema'],
          summary: 'Verificar conectividad SMTP',
          description: 'Verifica la conectividad y configuración del servidor SMTP. Útil para diagnóstico y monitoreo.',
          operationId: 'smtpCheck',
          security: [{ ApiKeyAuth: [] }],
          responses: {
            '200': {
              description: 'Verificación SMTP exitosa',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/SMTPCheckResponse' }
                }
              }
            },
            '401': {
              description: 'No autorizado',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/UnauthorizedError' }
                }
              }
            },
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
      
      '/api/v1/templates': {
        get: {
          tags: ['Plantillas'],
          summary: 'Listar todas las plantillas',
          description: 'Obtiene la lista completa de plantillas de email disponibles.',
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
                  }
                }
              }
            },
            '401': {
              description: 'No autorizado',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/UnauthorizedError' }
                }
              }
            }
          }
        },
        
        post: {
          tags: ['Plantillas'],
          summary: 'Crear nueva plantilla',
          description: 'Crea una nueva plantilla de email con contenido Handlebars. ID opcional (se genera automáticamente si no se proporciona).',
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
                      html: '<div><h1>¡Hola {{firstName}}!</h1><p>Te damos la bienvenida a <strong>{{company}}</strong>.</p></div>',
                      defaults: {
                        from: 'bienvenida@ejemplo.com',
                        replyTo: 'soporte@ejemplo.com'
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
            '400': {
              description: 'Error de validación',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ValidationError' }
                }
              }
            },
            '401': {
              description: 'No autorizado',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/UnauthorizedError' }
                }
              }
            },
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
            '401': {
              description: 'No autorizado',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/UnauthorizedError' }
                }
              }
            },
            '404': {
              description: 'Plantilla no encontrada',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/NotFoundError' }
                }
              }
            }
          }
        },
        
        put: {
          tags: ['Plantillas'],
          summary: 'Actualizar plantilla existente',
          description: 'Actualiza una plantilla existente. Solo se modifican los campos proporcionados. El ID de la plantilla no se puede modificar.',
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
                schema: { $ref: '#/components/schemas/TemplateUpdate' }
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
            '400': {
              description: 'Error de validación',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ValidationError' }
                }
              }
            },
            '401': {
              description: 'No autorizado',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/UnauthorizedError' }
                }
              }
            },
            '404': {
              description: 'Plantilla no encontrada',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/NotFoundError' }
                }
              }
            }
          }
        },
        
        delete: {
          tags: ['P
      
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
    customSiteTitle: '📧 SMTP Microservice API - Documentación Completa',
    customfavIcon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23059669"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.89 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>',
    customCss: `
      /* === LAYOUT GENERAL === */
      .swagger-ui .topbar { display: none; }
      
      body { 
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        min-height: 100vh;
      }
      
      .swagger-ui .wrapper { 
        max-width: 1200px; 
        margin: 0 auto; 
        padding: 20px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        margin-top: 20px;
        margin-bottom: 20px;
      }

      /* === HEADER DE LA API === */
      .swagger-ui .info { 
        margin: 0 0 40px 0; 
        padding: 30px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 12px;
        color: white;
        position: relative;
        overflow: hidden;
      }
      
      .swagger-ui .info::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.1"/><circle cx="10" cy="60" r="0.5" fill="white" opacity="0.1"/><circle cx="90" cy="40" r="0.5" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
        pointer-events: none;
      }
      
      .swagger-ui .info .title { 
        font-size: 32px; 
        font-weight: 800; 
        color: white;
        margin-bottom: 15px;
        text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        position: relative;
        z-index: 1;
      }
      
      .swagger-ui .info .description { 
        font-size: 16px; 
        line-height: 1.7;
        color: rgba(255,255,255,0.95);
        position: relative;
        z-index: 1;
      }
      
      .swagger-ui .info .description h1 {
        color: white;
        font-size: 24px;
        margin-top: 25px;
        margin-bottom: 15px;
        font-weight: 700;
      }
      
      .swagger-ui .info .description h2 {
        color: rgba(255,255,255,0.9);
        font-size: 18px;
        margin-top: 20px;
        margin-bottom: 10px;
        font-weight: 600;
      }
      
      .swagger-ui .info .description ul {
        margin: 10px 0;
        padding-left: 20px;
      }
      
      .swagger-ui .info .description li {
        margin: 5px 0;
        color: rgba(255,255,255,0.9);
      }
      
      .swagger-ui .info .description code {
        background: rgba(255,255,255,0.2);
        padding: 2px 6px;
        border-radius: 4px;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        font-size: 14px;
      }

      /* === AUTENTICACIÓN === */
      .swagger-ui .scheme-container { 
        margin: 25px 0; 
        padding: 20px; 
        background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
        border-radius: 10px;
        border: 2px solid #f59e0b;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      }
      
      .swagger-ui .auth-wrapper { 
        padding: 20px; 
        background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
        border-radius: 10px;
        border: 2px solid #10b981;
        margin: 25px 0;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      }
      
      .swagger-ui .auth-btn-wrapper .btn.authorize {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        transition: all 0.3s ease;
      }
      
      .swagger-ui .auth-btn-wrapper .btn.authorize:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 15px -3px rgba(0, 0, 0, 0.2);
      }

      /* === OPERACIONES/ENDPOINTS === */
      .swagger-ui .opblock { 
        margin: 20px 0; 
        border-radius: 10px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        overflow: hidden;
        transition: all 0.3s ease;
      }
      
      .swagger-ui .opblock:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.15);
      }
      
      .swagger-ui .opblock.opblock-post { 
        border-color: #059669;
        border-left: 6px solid #059669;
      }
      .swagger-ui .opblock.opblock-get { 
        border-color: #0ea5e9;
        border-left: 6px solid #0ea5e9;
      }
      .swagger-ui .opblock.opblock-put { 
        border-color: #f59e0b;
        border-left: 6px solid #f59e0b;
      }
      .swagger-ui .opblock.opblock-delete { 
        border-color: #ef4444;
        border-left: 6px solid #ef4444;
      }
      
      .swagger-ui .opblock-summary { 
        font-weight: 600; 
        font-size: 16px;
        padding: 15px 20px;
      }
      
      .swagger-ui .opblock-description-wrapper { 
        padding: 20px;
        background: #f8fafc;
      }
      
      .swagger-ui .opblock-description-wrapper p { 
        margin: 10px 0; 
        line-height: 1.6;
        color: #374151;
      }

      /* === TAGS/SECCIONES === */
      .swagger-ui .opblock-tag {
        font-size: 20px;
        font-weight: 700;
        margin: 40px 0 20px 0;
        padding: 15px 0;
        border-bottom: 3px solid #e5e7eb;
        color: #1f2937;
      }
      
      .swagger-ui .opblock-tag:first-child {
        margin-top: 20px;
      }

      /* === PARÁMETROS Y FORMULARIOS === */
      .swagger-ui .parameter__name { 
        font-weight: 600; 
        color: #1f2937;
      }
      
      .swagger-ui .parameter__type {
        color: #6b7280;
        font-style: italic;
      }
      
      .swagger-ui .parameter__in {
        background: #e5e7eb;
        color: #374151;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
      }

      /* === RESPUESTAS === */
      .swagger-ui .response-col_status { 
        font-weight: 700;
        font-size: 14px;
      }
      
      .swagger-ui .response-col_status.response-200 { color: #059669; }
      .swagger-ui .response-col_status.response-201 { color: #059669; }
      .swagger-ui .response-col_status.response-202 { color: #059669; }
      .swagger-ui .response-col_status.response-400 { color: #f59e0b; }
      .swagger-ui .response-col_status.response-401 { color: #ef4444; }
      .swagger-ui .response-col_status.response-404 { color: #ef4444; }
      .swagger-ui .response-col_status.response-409 { color: #f59e0b; }
      .swagger-ui .response-col_status.response-500 { color: #ef4444; }
      .swagger-ui .response-col_status.response-502 { color: #ef4444; }

      /* === TABLAS === */
      .swagger-ui table thead tr th { 
        font-weight: 700; 
        background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
        color: #1f2937;
        padding: 12px;
        border-bottom: 2px solid #cbd5e1;
      }
      
      .swagger-ui table tbody tr td {
        padding: 12px;
        border-bottom: 1px solid #e5e7eb;
      }
      
      .swagger-ui table tbody tr:hover {
        background: #f8fafc;
      }

      /* === BOTONES === */
      .swagger-ui .btn {
        border-radius: 8px;
        font-weight: 600;
        padding: 10px 20px;
        transition: all 0.3s ease;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-size: 13px;
      }
      
      .swagger-ui .btn.execute {
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        border: none;
        color: white;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      }
      
      .swagger-ui .btn.execute:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 15px -3px rgba(0, 0, 0, 0.2);
      }
      
      .swagger-ui .btn.try-out__btn {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        border: none;
        color: white;
      }
      
      .swagger-ui .btn.cancel {
        background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
        border: none;
        color: white;
      }

      /* === CÓDIGO Y EJEMPLOS === */
      .swagger-ui .highlight-code {
        background: #1f2937;
        border-radius: 8px;
        padding: 20px;
        margin: 15px 0;
      }
      
      .swagger-ui .highlight-code pre {
        color: #f9fafb;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        font-size: 14px;
        line-height: 1.5;
      }
      
      .swagger-ui .model-box {
        background: #f8fafc;
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        padding: 15px;
        margin: 10px 0;
      }
      
      .swagger-ui .model-title {
        font-weight: 700;
        color: #1f2937;
        margin-bottom: 10px;
      }

      /* === FILTROS Y BÚSQUEDA === */
      .swagger-ui .filter-container {
        margin: 20px 0;
        padding: 15px;
        background: #f8fafc;
        border-radius: 8px;
        border: 1px solid #e5e7eb;
      }
      
      .swagger-ui .filter .operation-filter-input {
        border: 2px solid #d1d5db;
        border-radius: 8px;
        padding: 10px 15px;
        font-size: 14px;
        width: 100%;
        transition: border-color 0.3s ease;
      }
      
      .swagger-ui .filter .operation-filter-input:focus {
        border-color: #3b82f6;
        outline: none;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }

      /* === ANIMACIONES === */
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      .swagger-ui .opblock {
        animation: fadeIn 0.5s ease-out;
      }
      
      /* === RESPONSIVE === */
      @media (max-width: 768px) {
        .swagger-ui .wrapper {
          margin: 10px;
          padding: 15px;
          border-radius: 8px;
        }
        
        .swagger-ui .info {
          padding: 20px;
        }
        
        .swagger-ui .info .title {
          font-size: 24px;
        }
        
        .swagger-ui .opblock-summary {
          font-size: 14px;
          padding: 12px 15px;
        }
      }

      /* === MEJORAS DE ACCESIBILIDAD === */
      .swagger-ui .opblock:focus-within {
        outline: 3px solid #3b82f6;
        outline-offset: 2px;
      }
      
      .swagger-ui .btn:focus {
        outline: 3px solid #3b82f6;
        outline-offset: 2px;
      }
      
      /* === ESTADOS DE CARGA === */
      .swagger-ui .loading {
        position: relative;
      }
      
      .swagger-ui .loading::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 20px;
        height: 20px;
        margin: -10px 0 0 -10px;
        border: 2px solid #e5e7eb;
        border-top: 2px solid #3b82f6;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      /* === BADGES Y ETIQUETAS === */
      .swagger-ui .opblock-summary .opblock-summary-method {
        font-weight: 700;
        text-transform: uppercase;
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 12px;
        letter-spacing: 1px;
        margin-right: 10px;
      }
      
      /* === TOOLTIPS MEJORADOS === */
      .swagger-ui [title] {
        position: relative;
      }
      
      .swagger-ui [title]:hover::after {
        content: attr(title);
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        background: #1f2937;
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        white-space: nowrap;
        z-index: 1000;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      }
    `,
    swaggerOptions: {
      // Expansión y navegación
      docExpansion: 'list',
      operationsSorter: 'alpha',
      tagsSorter: 'alpha',
      
      // Funcionalidades interactivas
      filter: true,
      showRequestDuration: true,
      showCommonExtensions: true,
      showExtensions: true,
      tryItOutEnabled: true,
      requestSnippetsEnabled: true,
      
      // Modelos y esquemas
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 2,
      defaultModelRendering: 'model',
      
      // Autenticación
      persistAuthorization: true,
      
      // Validación
      validatorUrl: null,
      
      // Métodos soportados
      supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch', 'head', 'options'],
      
      // Configuración de sintaxis
      syntaxHighlight: {
        activate: true,
        theme: 'monokai'
      },
      
      // Configuración de plugins
      plugins: [
        'DownloadUrl'
      ],
      
      // Configuración de layout
      layout: 'StandaloneLayout',
      
      // Configuración de deep linking
      deepLinking: true,
      displayOperationId: false,
      displayRequestDuration: true,
      
      // Configuración de ejemplos
      showMutatedRequest: true,
      
      // Configuración de respuestas
      showResponseHeaders: true,
      
      // Configuración de parámetros
      showParameterExtensions: true,
      
      // Configuración de modelos
      showModelStructure: true,
      
      // Configuración de filtros
      operationFilter: null,
      tagFilter: null,
      
      // Configuración de URLs
      url: '/openapi.json',
      
      // Configuración de OAuth (si se necesita en el futuro)
      oauth2RedirectUrl: undefined,
      
      // Configuración de CORS
      requestInterceptor: (request) => {
        // Agregar headers personalizados si es necesario
        return request;
      },
      
      responseInterceptor: (response) => {
        // Procesar respuestas si es necesario
        return response;
      },
      
      // Configuración de errores
      onComplete: () => {
        console.log('📚 Swagger UI cargado completamente');
      },
      
      onFailure: (error) => {
        console.error('❌ Error cargando Swagger UI:', error);
      }
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

  console.log('');
  console.log('📚 ===============================================');
  console.log('📧 SMTP Microservice API - Documentación Lista');
  console.log('📚 ===============================================');
  console.log(`🌐 Documentación interactiva: ${swaggerPath}`);
  console.log(`📄 Especificación OpenAPI: /openapi.json`);
  console.log(`🔧 Especificación alternativa: /swagger.json`);
  console.log('');
  console.log('✨ Características disponibles:');
  console.log('   • 11 endpoints completamente documentados');
  console.log('   • 20+ esquemas con validaciones detalladas');
  console.log('   • Ejemplos interactivos para cada endpoint');
  console.log('   • Autenticación integrada con persistencia');
  console.log('   • Filtros y búsqueda en tiempo real');
  console.log('   • Interfaz responsive y accesible');
  console.log('');
  console.log('🚀 Para empezar:');
  console.log('   1. Abre la documentación en tu navegador');
  console.log('   2. Haz clic en "Authorize" y configura tu API token');
  console.log('   3. Explora y prueba los endpoints en vivo');
  console.log('📚 ===============================================');
  console.log('');
}
