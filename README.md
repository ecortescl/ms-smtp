# Microservicio SMTP (Node + Express)

Microservicio para enviar correos vía API usando SMTP. Incluye autenticación por token (header `x-api-token`) y documentación interactiva con Swagger en `/docs`.

## Requisitos
- Node.js 18+
- Servidor SMTP accesible (host, puerto, credenciales si aplica)

## Instalación
1. Copia `.env.example` a `.env` y completa los valores:
   ```bash
   cp .env.example .env
   ```
2. Instala dependencias:
   ```bash
   npm install
   ```

## Variables de entorno principales
- `PORT`: Puerto del servidor Express (default 3000)
- `API_TOKEN`: Token para consumir la API (requerido)
- `SMTP_HOST`: Host SMTP (requerido)
- `SMTP_PORT`: Puerto SMTP (587 típico, 465 para TLS implícito)
- `SMTP_SECURE`: `true` si usas 465 (TLS implícito); `false` para STARTTLS en 587
- `SMTP_USER`, `SMTP_PASS`: Credenciales SMTP si son necesarias
- `SMTP_FROM_DEFAULT`: Remitente por defecto si no se envía `from` en el payload

Opciones avanzadas en `.env.example`.

## Ejecutar
- Desarrollo (con nodemon):
  ```bash
  npm run dev
  ```
- Producción:
  ```bash
  npm start
  ```

La app escuchará en `http://localhost:3000` (o el puerto configurado).

## Documentación Swagger
- Abre `http://localhost:3000/docs`.
- Agrega el header de seguridad `x-api-token` con el valor de `API_TOKEN` para probar los endpoints.

## Endpoint

POST ` /api/v1/send-email `

Headers:
- `Content-Type: application/json`
- `x-api-token: <tu_token>`

Body (JSON):
```json
{
  "from": "Nombre <no-reply@example.com>",
  "to": ["destino@example.com"],
  "cc": "copia@example.com",
  "bcc": ["oculto1@example.com", "oculto2@example.com"],
  "subject": "Asunto de prueba",
  "html": "<h1>Hola</h1><p>Este es un correo de prueba</p>",
  "text": "Hola - Este es un correo de prueba",
  "replyTo": "responder-a@example.com",
  "attachments": [
    {
      "filename": "ejemplo.txt",
      "content": "SG9sYQ==",
      "encoding": "base64"
    }
  ]
}
```

Respuesta 202:
```json
{
  "status": "queued",
  "result": {
    "messageId": "<...>",
    "accepted": ["destino@example.com"],
    "rejected": [],
    "response": "250 2.0.0 Ok: queued"
  }
}
```

## Ejemplo con curl
```bash
curl -X POST http://localhost:3000/api/v1/send-email \
  -H 'Content-Type: application/json' \
  -H 'x-api-token: TU_TOKEN' \
  -d '{
    "to": "destino@example.com",
    "subject": "Hola",
    "html": "<b>Prueba</b>"
  }'
```

## Logs de envíos

- GET `/api/v1/logs` (con `x-api-token`):
  - Query params opcionales: `status`, `to`, `from`, `contains`, `start`, `end`, `limit`, `offset`.
  - Ejemplo:
    ```bash
    curl 'http://localhost:3001/api/v1/logs?status=success,failed&limit=50' \
      -H 'x-api-token: TU_TOKEN'
    ```
  - Respuesta: objeto con `total`, `offset`, `limit`, `items` (cada item es un evento con `status`, `timestamp`, `to`, `from`, `subject`, etc.)

- POST `/api/v1/logs` (con `x-api-token`):
  - Permite registrar manualmente eventos como `canceled` o `spam` cuando provienen de otro sistema/feedback.
  - Body:
    ```json
    {
      "status": "canceled",
      "to": "user@example.com",
      "subject": "Campaña X",
      "meta": { "reason": "usuario solicitó cancelación" }
    }
    ```

### Notas
- El servicio registra automáticamente `success` y `failed` en el endpoint de envío.
- Estados como `canceled` o `spam` usualmente provienen de feedback externo (proveedor, webhook, sistema anti-spam). Puedes registrarlos vía `POST /api/v1/logs`.
- Los logs se almacenan en formato JSONL en `LOG_DIR/LOG_FILE_NAME` (ver `.env.example`).

## Salud del servicio
- `GET /health` -> `{ status: 'ok', uptime: <segundos> }`

## Notas de seguridad
- Mantén `API_TOKEN` en secreto y cámbialo regularmente.
- En producción, usa `SMTP_TLS_REJECT_UNAUTH=true`.
- Configura correctamente CORS si expones el servicio a terceros.
