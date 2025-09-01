# Configuración de Swagger

La documentación de la API se genera automáticamente usando Swagger/OpenAPI 3.0 y está disponible en `/api-docs`.

## Variables de Entorno

### Configuración Básica

```bash
# Protocolo (http o https)
SWAGGER_PROTOCOL=http

# Host del servidor
SWAGGER_HOST=localhost

# Puerto (opcional, usa PORT por defecto)
SWAGGER_PORT=3000

# Ruta base adicional (opcional)
SWAGGER_BASE_PATH=/api

# Descripción del servidor
SWAGGER_SERVER_DESCRIPTION="Development server"
```

### Servidor Adicional (Opcional)

```bash
# URL completa de un servidor adicional
SWAGGER_ADDITIONAL_SERVER_URL=https://api.production.com

# Descripción del servidor adicional
SWAGGER_ADDITIONAL_SERVER_DESCRIPTION="Production server"
```

## Ejemplos de Configuración

### Desarrollo Local
```bash
SWAGGER_PROTOCOL=http
SWAGGER_HOST=localhost
SWAGGER_PORT=3000
SWAGGER_SERVER_DESCRIPTION="Local development"
```

### Producción con Nginx
```bash
SWAGGER_PROTOCOL=https
SWAGGER_HOST=api.midominio.com
SWAGGER_BASE_PATH=
SWAGGER_SERVER_DESCRIPTION="Production API"
```

### Múltiples Entornos
```bash
SWAGGER_PROTOCOL=https
SWAGGER_HOST=api.staging.com
SWAGGER_SERVER_DESCRIPTION="Staging environment"
SWAGGER_ADDITIONAL_SERVER_URL=https://api.production.com
SWAGGER_ADDITIONAL_SERVER_DESCRIPTION="Production environment"
```

### Detrás de un Proxy/Load Balancer
```bash
SWAGGER_PROTOCOL=https
SWAGGER_HOST=api.midominio.com
SWAGGER_BASE_PATH=/v1
SWAGGER_SERVER_DESCRIPTION="API Gateway"
```

## Acceso a la Documentación

Una vez configurado, la documentación estará disponible en:
- **URL**: `http://localhost:3000/api-docs` (o según tu configuración)
- **Formato**: Interfaz interactiva de Swagger UI
- **Autenticación**: Puedes probar los endpoints directamente desde la interfaz

## Características

- ✅ Configuración dinámica basada en variables de entorno
- ✅ Soporte para múltiples servidores
- ✅ Documentación completa de todos los endpoints
- ✅ Esquemas de validación incluidos
- ✅ Ejemplos de request/response
- ✅ Interfaz interactiva para probar la API
- ✅ Soporte para autenticación con API token