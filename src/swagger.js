import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

export function setupSwagger(app) {
  const swaggerPath = process.env.SWAGGER_PATH || '/';
  const swaggerDefinition = {
    openapi: '3.0.3',
    info: {
      title: 'SMTP Microservice API',
      version: '1.0.0',
      description:
        'Microservicio para enviar correos vía SMTP. Autenticación por token en header x-api-token.',
    },
    servers: [
      { url: '/', description: 'Current host' },
    ],
    components: {
      securitySchemes: {
        ApiTokenAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-token',
          description: 'Token de API configurado en la variable de entorno API_TOKEN',
        },
      },
      schemas: {
        Attachment: {
          type: 'object',
          properties: {
            filename: { type: 'string' },
            content: { type: 'string', description: 'Base64 o texto (opcional si se usa path)' },
            contentType: { type: 'string' },
            encoding: { type: 'string' },
            path: { type: 'string', description: 'URL o ruta de archivo' },
          },
        },
        SendEmailRequest: {
          type: 'object',
          required: ['to', 'html'],
          properties: {
            from: { type: 'string', format: 'email' },
            to: {
              oneOf: [
                { type: 'string', format: 'email' },
                { type: 'array', items: { type: 'string', format: 'email' } },
              ],
            },
            cc: {
              oneOf: [
                { type: 'string', format: 'email' },
                { type: 'array', items: { type: 'string', format: 'email' } },
              ],
            },
            bcc: {
              oneOf: [
                { type: 'string', format: 'email' },
                { type: 'array', items: { type: 'string', format: 'email' } },
              ],
            },
            subject: { type: 'string' },
            html: { type: 'string' },
            text: { type: 'string' },
            replyTo: { type: 'string', format: 'email' },
            attachments: { type: 'array', items: { $ref: '#/components/schemas/Attachment' } },
          },
        },
        SendEmailResponse: {
          type: 'object',
          properties: {
            status: { type: 'string', example: 'queued' },
            result: {
              type: 'object',
              properties: {
                messageId: { type: 'string' },
                accepted: { type: 'array', items: { type: 'string' } },
                rejected: { type: 'array', items: { type: 'string' } },
                response: { type: 'string' },
              },
            },
          },
        },
        LogEntry: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
            status: { type: 'string', enum: ['success', 'failed', 'canceled', 'spam', 'queued', 'other'] },
            to: { oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }] },
            from: { type: 'string' },
            subject: { type: 'string' },
            provider: { type: 'string' },
            response: { type: 'string' },
            error: { type: 'string' },
            meta: { type: 'object', additionalProperties: true },
          },
        },
        LogsQueryResponse: {
          type: 'object',
          properties: {
            total: { type: 'integer' },
            offset: { type: 'integer' },
            limit: { type: 'integer' },
            items: { type: 'array', items: { $ref: '#/components/schemas/LogEntry' } },
          },
        },
        Template: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            subject: { type: 'string' },
            html: { type: 'string' },
            defaults: { type: 'object', additionalProperties: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        TemplateCreate: {
          type: 'object',
          required: ['name', 'subject', 'html'],
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            subject: { type: 'string' },
            html: { type: 'string' },
            defaults: { type: 'object', additionalProperties: true },
          },
        },
        TemplateUpdate: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            subject: { type: 'string' },
            html: { type: 'string' },
            defaults: { type: 'object', additionalProperties: true },
          },
        },
        SendTemplateRequest: {
          type: 'object',
          required: ['templateId'],
          properties: {
            templateId: { type: 'string' },
            params: { type: 'object', additionalProperties: true },
            from: { type: 'string', format: 'email' },
            to: { oneOf: [{ type: 'string', format: 'email' }, { type: 'array', items: { type: 'string', format: 'email' } }] },
            cc: { oneOf: [{ type: 'string', format: 'email' }, { type: 'array', items: { type: 'string', format: 'email' } }] },
            bcc: { oneOf: [{ type: 'string', format: 'email' }, { type: 'array', items: { type: 'string', format: 'email' } }] },
            replyTo: { type: 'string', format: 'email' },
            attachments: { type: 'array', items: { $ref: '#/components/schemas/Attachment' } },
          },
        },
      },
    },
    security: [{ ApiTokenAuth: [] }],
    paths: {
      '/api/v1/send-email': {
        post: {
          tags: ['Email'],
          summary: 'Enviar correo',
          description: 'Envía un correo usando SMTP',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SendEmailRequest' },
              },
            },
          },
          responses: {
            '202': {
              description: 'Aceptado',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/SendEmailResponse' },
                },
              },
            },
            '400': { description: 'Error de validación' },
            '401': { description: 'No autorizado' },
            '502': { description: 'Error SMTP' },
          },
          security: [{ ApiTokenAuth: [] }],
        },
      },
      '/api/v1/smtp-check': {
        get: {
          tags: ['Email'],
          summary: 'Verificar conectividad SMTP',
          description: 'Ejecuta transporter.verify() para comprobar conexión/credenciales SMTP',
          responses: {
            '200': {
              description: 'Conexión SMTP verificada',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      ok: { type: 'boolean', example: true },
                      verified: { type: 'boolean' },
                      host: { type: 'string' },
                      port: { type: 'integer' },
                      secure: { type: 'boolean' },
                    },
                  },
                },
              },
            },
            '401': { description: 'No autorizado' },
            '502': { description: 'Error al verificar SMTP' },
          },
          security: [{ ApiTokenAuth: [] }],
        },
      },
      '/api/v1/logs': {
        get: {
          tags: ['Logs'],
          summary: 'Consultar logs de envíos',
          parameters: [
            { in: 'query', name: 'status', schema: { type: 'string' }, description: 'success,failed,canceled,spam,queued,other o lista separada por comas' },
            { in: 'query', name: 'to', schema: { type: 'string' } },
            { in: 'query', name: 'from', schema: { type: 'string' } },
            { in: 'query', name: 'contains', schema: { type: 'string' }, description: 'Busca en subject/response' },
            { in: 'query', name: 'start', schema: { type: 'string', format: 'date-time' } },
            { in: 'query', name: 'end', schema: { type: 'string', format: 'date-time' } },
            { in: 'query', name: 'limit', schema: { type: 'integer', default: 100 } },
            { in: 'query', name: 'offset', schema: { type: 'integer', default: 0 } },
          ],
          responses: {
            '200': {
              description: 'OK',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/LogsQueryResponse' } } },
            },
            '401': { description: 'No autorizado' },
          },
          security: [{ ApiTokenAuth: [] }],
        },
        post: {
          tags: ['Logs'],
          summary: 'Agregar una entrada de log manualmente',
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/LogEntry' } },
            },
          },
          responses: {
            '201': { description: 'Creado', content: { 'application/json': { schema: { $ref: '#/components/schemas/LogEntry' } } } },
            '400': { description: 'Error de validación' },
            '401': { description: 'No autorizado' },
          },
          security: [{ ApiTokenAuth: [] }],
        },
      },
      '/api/v1/templates': {
        get: {
          tags: ['Templates'],
          summary: 'Listar plantillas',
          responses: {
            '200': { description: 'OK', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Template' } } } } },
            '401': { description: 'No autorizado' },
          },
          security: [{ ApiTokenAuth: [] }],
        },
        post: {
          tags: ['Templates'],
          summary: 'Crear plantilla',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/TemplateCreate' } } },
          },
          responses: {
            '201': { description: 'Creado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Template' } } } },
            '400': { description: 'Error de validación' },
            '401': { description: 'No autorizado' },
            '409': { description: 'Conflicto: ID ya existe' },
          },
          security: [{ ApiTokenAuth: [] }],
        },
      },
      '/api/v1/templates/{id}': {
        get: {
          tags: ['Templates'],
          summary: 'Obtener plantilla por ID',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/Template' } } } },
            '401': { description: 'No autorizado' },
            '404': { description: 'No encontrada' },
          },
          security: [{ ApiTokenAuth: [] }],
        },
        put: {
          tags: ['Templates'],
          summary: 'Actualizar plantilla',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/TemplateUpdate' } } },
          },
          responses: {
            '200': { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/Template' } } } },
            '400': { description: 'Error de validación' },
            '401': { description: 'No autorizado' },
            '404': { description: 'No encontrada' },
          },
          security: [{ ApiTokenAuth: [] }],
        },
        delete: {
          tags: ['Templates'],
          summary: 'Eliminar plantilla',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: {
            '204': { description: 'Eliminada' },
            '401': { description: 'No autorizado' },
            '404': { description: 'No encontrada' },
          },
          security: [{ ApiTokenAuth: [] }],
        },
      },
      '/api/v1/send-template': {
        post: {
          tags: ['Templates'],
          summary: 'Enviar correo usando una plantilla',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/SendTemplateRequest' } } },
          },
          responses: {
            '202': { description: 'Aceptado', content: { 'application/json': { schema: { $ref: '#/components/schemas/SendEmailResponse' } } } },
            '400': { description: 'Error de validación' },
            '401': { description: 'No autorizado' },
            '502': { description: 'Error SMTP' },
          },
          security: [{ ApiTokenAuth: [] }],
        },
      },
    },
  };

  const specs = swaggerJSDoc({ definition: swaggerDefinition, apis: [] });
  
  // Configura Swagger UI con CDN
  const swaggerHtml = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>SMTP Microservice API</title>
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui.css">
    <style>
      .swagger-ui .topbar { display: none }
      body { margin: 0; }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@4.5.0/swagger-ui-bundle.js"></script>
    <script>
      window.onload = function() {
        const ui = SwaggerUIBundle({
          spec: ${JSON.stringify(specs, null, 2)},
          dom_id: '#swagger-ui',
          presets: [
            SwaggerUIBundle.presets.apis,
            SwaggerUIBundle.SwaggerUIStandalonePreset
          ],
          layout: "BaseLayout",
          deepLinking: true
        });
      };
    </script>
  </body>
  </html>
  `;

  // Sirve la UI de Swagger
  app.get(swaggerPath, (req, res) => {
    res.send(swaggerHtml);
  });

  // Sirve el JSON de la especificación
  app.get('/swagger.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
}
