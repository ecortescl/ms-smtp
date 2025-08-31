# Ejemplos de Uso de la API SMTP

Este documento contiene ejemplos prácticos para usar todos los endpoints de la API.

## Configuración Inicial

Asegúrate de tener configurado el token de API en el header `x-api-token`:

```bash
export API_TOKEN="tu-token-seguro-aqui"
export API_URL="http://localhost:3000"
```

## 1. Verificar Estado del Servicio

```bash
# Verificar que el servicio está funcionando
curl -X GET "$API_URL/health"
```

**Respuesta esperada:**
```json
{
  "status": "ok",
  "uptime": 3600.5
}
```

## 2. Verificar Conectividad SMTP

```bash
# Verificar configuración SMTP
curl -X GET "$API_URL/api/v1/smtp-check" \
  -H "x-api-token: $API_TOKEN"
```

**Respuesta esperada:**
```json
{
  "ok": true,
  "verified": true,
  "host": "smtp.gmail.com",
  "port": 587,
  "secure": false
}
```

## 3. Envío Directo de Emails

### Email Simple

```bash
curl -X POST "$API_URL/api/v1/send-email" \
  -H "Content-Type: application/json" \
  -H "x-api-token: $API_TOKEN" \
  -d '{
    "to": "usuario@ejemplo.com",
    "subject": "Prueba de API",
    "html": "<h1>¡Hola!</h1><p>Este es un email de prueba desde la API.</p>"
  }'
```

### Email Completo con Adjuntos

```bash
curl -X POST "$API_URL/api/v1/send-email" \
  -H "Content-Type: application/json" \
  -H "x-api-token: $API_TOKEN" \
  -d '{
    "from": "remitente@ejemplo.com",
    "to": ["usuario1@ejemplo.com", "usuario2@ejemplo.com"],
    "cc": "supervisor@ejemplo.com",
    "bcc": "auditoria@ejemplo.com",
    "subject": "Reporte Mensual - Enero 2024",
    "html": "<h1>Reporte Mensual</h1><p>Adjunto encontrarás el reporte del mes de enero.</p><p>Saludos cordiales.</p>",
    "text": "Reporte Mensual\n\nAdjunto encontrarás el reporte del mes de enero.\n\nSaludos cordiales.",
    "replyTo": "soporte@ejemplo.com",
    "attachments": [
      {
        "filename": "reporte-enero.pdf",
        "content": "JVBERi0xLjQKJcOkw7zDtsO8w7HDqMO6...",
        "contentType": "application/pdf",
        "encoding": "base64"
      }
    ]
  }'
```

## 4. Gestión de Plantillas

### Crear Plantilla de Bienvenida

```bash
curl -X POST "$API_URL/api/v1/templates" \
  -H "Content-Type: application/json" \
  -H "x-api-token: $API_TOKEN" \
  -d '{
    "id": "bienvenida",
    "name": "Email de Bienvenida",
    "subject": "¡Bienvenido {{firstName}} a {{company}}!",
    "html": "<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;\"><h1 style=\"color: #333;\">¡Hola {{firstName}}!</h1><p>Te damos la bienvenida a <strong>{{company}}</strong>.</p><p>Para activar tu cuenta, haz clic en el siguiente enlace:</p><a href=\"{{activationUrl}}\" style=\"background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;\">Activar Cuenta</a><p>Si tienes alguna pregunta, no dudes en contactarnos.</p><p>Saludos,<br>El equipo de {{company}}</p></div>",
    "defaults": {
      "from": "bienvenida@ejemplo.com",
      "replyTo": "soporte@ejemplo.com"
    }
  }'
```

### Crear Plantilla de Newsletter

```bash
curl -X POST "$API_URL/api/v1/templates" \
  -H "Content-Type: application/json" \
  -H "x-api-token: $API_TOKEN" \
  -d '{
    "id": "newsletter",
    "name": "Newsletter Mensual",
    "subject": "Newsletter {{month}} - {{company}}",
    "html": "<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;\"><h1>Newsletter de {{month}}</h1><p>Hola {{userName}},</p><p>Aquí tienes las novedades de este mes:</p>{{#each articles}}<div style=\"border: 1px solid #ddd; padding: 15px; margin: 10px 0;\"><h3><a href=\"{{url}}\">{{title}}</a></h3><p>{{summary}}</p></div>{{/each}}<p>¡Gracias por suscribirte!</p></div>",
    "defaults": {
      "from": "newsletter@ejemplo.com"
    }
  }'
```

### Listar Todas las Plantillas

```bash
curl -X GET "$API_URL/api/v1/templates" \
  -H "x-api-token: $API_TOKEN"
```

### Obtener Plantilla Específica

```bash
curl -X GET "$API_URL/api/v1/templates/bienvenida" \
  -H "x-api-token: $API_TOKEN"
```

### Actualizar Plantilla

```bash
curl -X PUT "$API_URL/api/v1/templates/bienvenida" \
  -H "Content-Type: application/json" \
  -H "x-api-token: $API_TOKEN" \
  -d '{
    "subject": "¡Hola {{firstName}}! Bienvenido a {{company}} 🎉",
    "defaults": {
      "from": "bienvenida@ejemplo.com",
      "replyTo": "soporte@ejemplo.com",
      "bcc": "auditoria@ejemplo.com"
    }
  }'
```

### Eliminar Plantilla

```bash
curl -X DELETE "$API_URL/api/v1/templates/newsletter" \
  -H "x-api-token: $API_TOKEN"
```

## 5. Envío con Plantillas

### Envío Básico con Plantilla

```bash
curl -X POST "$API_URL/api/v1/send-template" \
  -H "Content-Type: application/json" \
  -H "x-api-token: $API_TOKEN" \
  -d '{
    "templateId": "bienvenida",
    "params": {
      "firstName": "Ana",
      "company": "Mi Empresa",
      "activationUrl": "https://ejemplo.com/activate/abc123"
    },
    "to": "ana@ejemplo.com"
  }'
```

### Envío Avanzado con Overrides

```bash
curl -X POST "$API_URL/api/v1/send-template" \
  -H "Content-Type: application/json" \
  -H "x-api-token: $API_TOKEN" \
  -d '{
    "templateId": "newsletter",
    "params": {
      "userName": "Carlos",
      "month": "Enero",
      "company": "TechCorp",
      "articles": [
        {
          "title": "Nuevas Funcionalidades en la Plataforma",
          "url": "https://ejemplo.com/articulo-1",
          "summary": "Descubre las últimas mejoras que hemos implementado."
        },
        {
          "title": "Consejos de Seguridad Digital",
          "url": "https://ejemplo.com/articulo-2",
          "summary": "Mantén tus datos seguros con estos consejos prácticos."
        }
      ]
    },
    "to": ["carlos@ejemplo.com", "maria@ejemplo.com"],
    "from": "newsletter@ejemplo.com",
    "attachments": [
      {
        "filename": "newsletter-enero.pdf",
        "path": "https://ejemplo.com/newsletters/enero-2024.pdf"
      }
    ]
  }'
```

## 6. Consulta de Logs

### Obtener Todos los Logs (Paginado)

```bash
curl -X GET "$API_URL/api/v1/logs?limit=50&offset=0" \
  -H "x-api-token: $API_TOKEN"
```

### Filtrar por Estado

```bash
# Solo emails exitosos
curl -X GET "$API_URL/api/v1/logs?status=success&limit=20" \
  -H "x-api-token: $API_TOKEN"

# Emails fallidos y cancelados
curl -X GET "$API_URL/api/v1/logs?status=failed,canceled" \
  -H "x-api-token: $API_TOKEN"
```

### Filtrar por Destinatario

```bash
curl -X GET "$API_URL/api/v1/logs?to=ana@ejemplo.com" \
  -H "x-api-token: $API_TOKEN"
```

### Filtrar por Rango de Fechas

```bash
curl -X GET "$API_URL/api/v1/logs?start=2024-01-01T00:00:00Z&end=2024-01-31T23:59:59Z" \
  -H "x-api-token: $API_TOKEN"
```

### Búsqueda por Contenido

```bash
curl -X GET "$API_URL/api/v1/logs?contains=bienvenida&limit=10" \
  -H "x-api-token: $API_TOKEN"
```

### Filtros Combinados

```bash
curl -X GET "$API_URL/api/v1/logs?status=success&to=ana&start=2024-01-15T00:00:00Z&limit=25" \
  -H "x-api-token: $API_TOKEN"
```

## 7. Registro Manual de Eventos

### Registrar Cancelación

```bash
curl -X POST "$API_URL/api/v1/logs" \
  -H "Content-Type: application/json" \
  -H "x-api-token: $API_TOKEN" \
  -d '{
    "status": "canceled",
    "to": "usuario@ejemplo.com",
    "from": "sistema@ejemplo.com",
    "subject": "Campaña Marketing Q1",
    "response": "Cancelado por solicitud del usuario",
    "meta": {
      "reason": "Usuario solicitó cancelación",
      "canceledBy": "admin@ejemplo.com",
      "originalMessageId": "<123@ejemplo.com>"
    }
  }'
```

### Registrar Spam

```bash
curl -X POST "$API_URL/api/v1/logs" \
  -H "Content-Type: application/json" \
  -H "x-api-token: $API_TOKEN" \
  -d '{
    "status": "spam",
    "to": "usuario@ejemplo.com",
    "subject": "Newsletter Semanal",
    "error": "Marked as spam by recipient",
    "meta": {
      "spamScore": 8.5,
      "provider": "gmail",
      "feedbackLoop": true
    }
  }'
```

## 8. Respuestas de Ejemplo

### Respuesta Exitosa de Envío

```json
{
  "status": "queued",
  "result": {
    "messageId": "<123456789@ejemplo.com>",
    "accepted": ["usuario@ejemplo.com"],
    "rejected": [],
    "response": "250 2.0.0 Ok: queued as 12345"
  }
}
```

### Respuesta de Error de Validación

```json
{
  "error": "ValidationError",
  "details": [
    "\"to\" is required",
    "\"html\" is required"
  ]
}
```

### Respuesta de Error SMTP

```json
{
  "error": "SMTPError",
  "message": "Connection timeout to SMTP server"
}
```

### Respuesta de Logs

```json
{
  "total": 150,
  "offset": 0,
  "limit": 50,
  "items": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "timestamp": "2024-01-15T10:30:00Z",
      "status": "success",
      "to": "usuario@ejemplo.com",
      "from": "sistema@ejemplo.com",
      "subject": "Bienvenido a nuestro servicio",
      "provider": "smtp",
      "response": "250 2.0.0 Ok: queued as 12345",
      "meta": {
        "messageId": "<123@ejemplo.com>",
        "templateId": "bienvenida",
        "accepted": ["usuario@ejemplo.com"],
        "rejected": []
      }
    }
  ]
}
```

## 9. Scripts de Automatización

### Script Bash para Envío Masivo

```bash
#!/bin/bash

# envio-masivo.sh
API_TOKEN="tu-token-aqui"
API_URL="http://localhost:3000"

# Lista de destinatarios
RECIPIENTS=("usuario1@ejemplo.com" "usuario2@ejemplo.com" "usuario3@ejemplo.com")

for email in "${RECIPIENTS[@]}"; do
  echo "Enviando a: $email"
  
  curl -X POST "$API_URL/api/v1/send-template" \
    -H "Content-Type: application/json" \
    -H "x-api-token: $API_TOKEN" \
    -d "{
      \"templateId\": \"bienvenida\",
      \"params\": {
        \"firstName\": \"Usuario\",
        \"company\": \"Mi Empresa\",
        \"activationUrl\": \"https://ejemplo.com/activate/$(uuidgen)\"
      },
      \"to\": \"$email\"
    }"
  
  echo ""
  sleep 1  # Pausa para evitar rate limiting
done
```

### Script Python para Monitoreo

```python
#!/usr/bin/env python3
import requests
import json
from datetime import datetime, timedelta

API_TOKEN = "tu-token-aqui"
API_URL = "http://localhost:3000"

headers = {
    "x-api-token": API_TOKEN,
    "Content-Type": "application/json"
}

# Obtener estadísticas de las últimas 24 horas
end_time = datetime.now()
start_time = end_time - timedelta(days=1)

params = {
    "start": start_time.isoformat() + "Z",
    "end": end_time.isoformat() + "Z",
    "limit": 1000
}

response = requests.get(f"{API_URL}/api/v1/logs", headers=headers, params=params)
logs = response.json()

# Contar por estado
stats = {}
for item in logs["items"]:
    status = item["status"]
    stats[status] = stats.get(status, 0) + 1

print("Estadísticas de las últimas 24 horas:")
print(json.dumps(stats, indent=2))
```

## 10. Documentación Interactiva

Visita la documentación interactiva de Swagger UI en:
- **URL**: `http://localhost:3000/docs`
- **Autenticación**: Usa el botón "Authorize" e ingresa tu token API
- **Pruebas**: Puedes probar todos los endpoints directamente desde la interfaz

La documentación incluye:
- Esquemas detallados de todos los objetos
- Ejemplos de request y response
- Validaciones y restricciones
- Códigos de error y sus significados
- Posibilidad de ejecutar requests en vivo