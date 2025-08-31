# Configuración de Swagger UI

## Descripción General

La API del microservicio SMTP incluye documentación completa e interactiva usando **OpenAPI 3.0.3** y **Swagger UI**. La documentación está completamente integrada en el código y se genera automáticamente al iniciar el servicio.

## Características de la Documentación

### ✅ Completamente Actualizada
- **OpenAPI 3.0.3**: Última versión del estándar
- **Swagger UI 5.x**: Interfaz moderna y responsive
- **Documentación en línea**: Toda la documentación está en el código, no en archivos externos

### ✅ Documentación Detallada
- **Todos los endpoints**: 11 endpoints completamente documentados
- **Esquemas completos**: 20+ esquemas con validaciones y ejemplos
- **Ejemplos múltiples**: Casos de uso simples y avanzados para cada endpoint
- **Códigos de error**: Documentación completa de todos los posibles errores

### ✅ Funcionalidad Interactiva
- **Try it out**: Ejecuta requests directamente desde la documentación
- **Autenticación integrada**: Botón "Authorize" para configurar el token API
- **Validación en tiempo real**: Validación de esquemas antes del envío
- **Snippets de código**: Ejemplos en múltiples lenguajes

## Acceso a la Documentación

### URL Principal
```
http://localhost:3000/docs
```

### URLs Alternativas
```
# Especificación OpenAPI en JSON
http://localhost:3000/openapi.json
http://localhost:3000/swagger.json  # Alias para compatibilidad
```

### Configuración de Ruta
La ruta de Swagger UI se puede personalizar con la variable de entorno:
```bash
SWAGGER_PATH=/docs  # Ruta por defecto
SWAGGER_PATH=/api-docs  # Ruta alternativa
```

## Estructura de la Documentación

### 1. Información General
- **Título**: SMTP Microservice API
- **Versión**: 1.0.0
- **Descripción**: Documentación completa con guías de uso
- **Contacto**: Información de soporte técnico
- **Licencia**: MIT

### 2. Autenticación
- **Tipo**: API Key
- **Header**: `x-api-token`
- **Descripción**: Token requerido para todos los endpoints (excepto /health y /docs)

### 3. Endpoints Documentados

#### Sistema (2 endpoints)
- `GET /health` - Verificar estado del servicio
- `GET /api/v1/smtp-check` - Verificar conectividad SMTP

#### Envío de Emails (2 endpoints)
- `POST /api/v1/send-email` - Enviar email directo
- `POST /api/v1/send-template` - Enviar email desde plantilla

#### Plantillas (4 endpoints)
- `GET /api/v1/templates` - Listar plantillas
- `POST /api/v1/templates` - Crear plantilla
- `GET /api/v1/templates/{id}` - Obtener plantilla
- `PUT /api/v1/templates/{id}` - Actualizar plantilla
- `DELETE /api/v1/templates/{id}` - Eliminar plantilla

#### Logs y Auditoría (2 endpoints)
- `GET /api/v1/logs` - Consultar logs con filtros
- `POST /api/v1/logs` - Registrar evento manual

### 4. Esquemas Principales

#### Requests
- `SendEmailRequest` - Envío directo de email
- `SendTemplateRequest` - Envío con plantilla
- `Template` - Creación de plantilla
- `TemplateUpdate` - Actualización de plantilla
- `CreateLogRequest` - Registro manual de evento

#### Responses
- `EmailSentResponse` - Respuesta de envío exitoso
- `SMTPCheckResponse` - Estado de conectividad SMTP
- `LogsResponse` - Lista paginada de logs
- `HealthResponse` - Estado del servicio

#### Tipos Comunes
- `EmailAddress` - Dirección de email válida
- `EmailAddressList` - Una o múltiples direcciones
- `Attachment` - Archivo adjunto (base64 o URL)
- `EmailLog` - Evento de email registrado

#### Errores
- `ValidationError` - Error de validación de datos
- `UnauthorizedError` - Error de autenticación
- `SMTPError` - Error del servidor SMTP
- `NotFoundError` - Recurso no encontrado

## Ejemplos Incluidos

### Cada Endpoint Incluye:
1. **Descripción detallada** del propósito y funcionamiento
2. **Múltiples ejemplos** (básico y avanzado)
3. **Validaciones** y restricciones de datos
4. **Códigos de respuesta** con ejemplos
5. **Casos de error** comunes

### Ejemplos Destacados:

#### Email Simple
```json
{
  "to": "usuario@ejemplo.com",
  "subject": "Hola desde la API",
  "html": "<h1>¡Hola!</h1><p>Este es un mensaje de prueba.</p>"
}
```

#### Email con Plantilla
```json
{
  "templateId": "bienvenida",
  "params": {
    "firstName": "Ana",
    "company": "Mi Empresa"
  },
  "to": "ana@ejemplo.com"
}
```

#### Plantilla con Handlebars
```json
{
  "id": "newsletter",
  "name": "Newsletter Mensual",
  "subject": "Newsletter {{month}} - {{company}}",
  "html": "<h1>Newsletter de {{month}}</h1>{{#each articles}}<div><h3>{{title}}</h3></div>{{/each}}"
}
```

## Personalización de la Interfaz

### Tema y Estilos
La documentación incluye estilos personalizados para:
- **Colores**: Esquema de colores profesional
- **Tipografía**: Fuentes legibles y jerarquía clara
- **Espaciado**: Layout optimizado para lectura
- **Highlighting**: Sintaxis destacada para código

### Configuración Avanzada
```javascript
swaggerOptions: {
  docExpansion: 'list',        // Expandir secciones por defecto
  filter: true,                // Habilitar filtro de búsqueda
  showRequestDuration: true,   // Mostrar tiempo de respuesta
  persistAuthorization: true,  // Recordar token entre sesiones
  tryItOutEnabled: true,       // Habilitar "Try it out"
  requestSnippetsEnabled: true // Mostrar snippets de código
}
```

## Uso Práctico

### 1. Configurar Autenticación
1. Abrir la documentación en `/docs`
2. Hacer clic en el botón **"Authorize"** (candado verde)
3. Ingresar el token API en el campo `x-api-token`
4. Hacer clic en **"Authorize"**

### 2. Probar Endpoints
1. Expandir el endpoint deseado
2. Hacer clic en **"Try it out"**
3. Modificar los parámetros de ejemplo
4. Hacer clic en **"Execute"**
5. Revisar la respuesta en tiempo real

### 3. Copiar Ejemplos
- Cada request incluye ejemplos copiables
- Los snippets de código están disponibles en múltiples lenguajes
- Los esquemas muestran la estructura exacta requerida

## Integración con Desarrollo

### Actualización Automática
- La documentación se actualiza automáticamente al modificar el código
- No requiere archivos externos o generación manual
- Los cambios en esquemas se reflejan inmediatamente

### Validación de Contratos
- Los esquemas de Swagger coinciden exactamente con las validaciones Joi
- Garantiza consistencia entre documentación y implementación
- Facilita el desarrollo dirigido por contratos (Contract-First)

### Testing
- Los ejemplos de la documentación sirven como casos de prueba
- Facilita la creación de tests automatizados
- Permite validar la API contra la especificación OpenAPI

## Troubleshooting

### Problemas Comunes

#### 1. Documentación no carga
```bash
# Verificar que el servicio está corriendo
curl http://localhost:3000/health

# Verificar la ruta configurada
echo $SWAGGER_PATH
```

#### 2. Autenticación no funciona
- Verificar que el token API está configurado correctamente
- Usar el botón "Authorize" en lugar de headers manuales
- Verificar que el token coincide con `API_TOKEN` del servidor

#### 3. Ejemplos no funcionan
- Verificar que el servidor SMTP está configurado
- Revisar los logs del servidor para errores específicos
- Usar direcciones de email válidas en los ejemplos

### Logs de Swagger
El servidor muestra información de Swagger al iniciar:
```
📚 Documentación completa de la API disponible en: /docs
📄 Especificación OpenAPI JSON disponible en: /openapi.json
```

## Mejores Prácticas

### Para Desarrolladores
1. **Mantener sincronizada** la documentación con los cambios de código
2. **Usar ejemplos realistas** que funcionen en el entorno de desarrollo
3. **Documentar todos los casos de error** posibles
4. **Incluir validaciones** detalladas en los esquemas

### Para Usuarios de la API
1. **Empezar con ejemplos simples** antes de casos complejos
2. **Usar la autenticación integrada** para pruebas
3. **Revisar los códigos de error** para debugging
4. **Consultar los esquemas** para entender la estructura de datos

### Para Integración
1. **Usar la especificación OpenAPI** para generar clientes
2. **Validar requests** contra los esquemas documentados
3. **Implementar manejo de errores** basado en los códigos documentados
4. **Seguir los ejemplos** para casos de uso comunes