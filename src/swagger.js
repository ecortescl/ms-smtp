import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

export function setupSwagger(app) {
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
          required: ['to', 'subject', 'html'],
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
    },
  };

  const specs = swaggerJSDoc({ definition: swaggerDefinition, apis: [] });
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs, { explorer: true }));
}
