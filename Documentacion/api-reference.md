# API Reference

## Autenticación

Todas las rutas de API requieren autenticación excepto las rutas públicas. La autenticación se maneja mediante NextAuth.js con JWT tokens.

### Headers Requeridos

\`\`\`http
Authorization: Bearer <jwt-token>
Content-Type: application/json
\`\`\`

## Endpoints de Autenticación

### POST /api/auth/signup

Crear nueva cuenta de usuario.

**Request Body:**
\`\`\`json
{
  "email": "usuario@ejemplo.com",
  "password": "password123",
  "name": "Nombre Usuario",
  "role": "STUDENT",
  "academyId": "academy_id"
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "user": {
    "id": "user_id",
    "email": "usuario@ejemplo.com",
    "name": "Nombre Usuario",
    "role": "STUDENT"
  }
}
\`\`\`

### POST /api/auth/signin

Iniciar sesión (manejado por NextAuth).

### POST /api/auth/signout

Cerrar sesión (manejado por NextAuth).

## Endpoints de Academia

### GET /api/admin/academy

Obtener información de la academia actual.

**Response:**
\`\`\`json
{
  "id": "academy_id",
  "name": "Mi Academia",
  "slug": "mi-academia",
  "branding": {
    "primaryColor": "#3b82f6",
    "secondaryColor": "#64748b",
    "logo": "https://...",
    "favicon": "https://..."
  },
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00Z"
}
\`\`\`

### PUT /api/admin/academy

Actualizar información de la academia.

**Request Body:**
\`\`\`json
{
  "name": "Nuevo Nombre",
  "branding": {
    "primaryColor": "#ef4444",
    "secondaryColor": "#64748b"
  }
}
\`\`\`

## Endpoints de Usuarios

### GET /api/admin/users

Listar usuarios de la academia.

**Query Parameters:**
- `role` (opcional): Filtrar por rol
- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Elementos por página (default: 10)

**Response:**
\`\`\`json
{
  "users": [
    {
      "id": "user_id",
      "email": "usuario@ejemplo.com",
      "name": "Nombre Usuario",
      "role": "STUDENT",
      "createdAt": "2024-01-01T00:00:00Z",
      "membership": {
        "status": "ACTIVE",
        "plan": {
          "name": "Plan Básico",
          "price": 29.99
        }
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5
  }
}
\`\`\`

### POST /api/admin/users

Crear nuevo usuario.

**Request Body:**
\`\`\`json
{
  "email": "nuevo@ejemplo.com",
  "name": "Nuevo Usuario",
  "role": "STUDENT",
  "planId": "plan_id"
}
\`\`\`

### PUT /api/admin/users/[id]

Actualizar usuario existente.

### DELETE /api/admin/users/[id]

Eliminar usuario.

## Endpoints de Planes

### GET /api/admin/plans

Listar planes de la academia.

**Response:**
\`\`\`json
{
  "plans": [
    {
      "id": "plan_id",
      "name": "Plan Básico",
      "price": 29.99,
      "currency": "USD",
      "interval": "monthly",
      "features": ["Acceso a clases", "Contenido básico"],
      "isActive": true,
      "odooProductId": 123
    }
  ]
}
\`\`\`

### POST /api/admin/plans

Crear nuevo plan.

**Request Body:**
\`\`\`json
{
  "name": "Plan Premium",
  "price": 49.99,
  "interval": "monthly",
  "features": ["Acceso ilimitado", "Contenido premium"],
  "odooProductId": 124
}
\`\`\`

## Endpoints de Clases

### GET /api/classes

Listar clases disponibles.

**Query Parameters:**
- `date` (opcional): Filtrar por fecha (YYYY-MM-DD)
- `branchId` (opcional): Filtrar por sede
- `instructorId` (opcional): Filtrar por instructor

**Response:**
\`\`\`json
{
  "classes": [
    {
      "id": "class_id",
      "name": "Karate Básico",
      "description": "Clase para principiantes",
      "startTime": "2024-01-01T18:00:00Z",
      "endTime": "2024-01-01T19:00:00Z",
      "capacity": 20,
      "enrolled": 15,
      "instructor": {
        "name": "Sensei Juan",
        "email": "juan@academia.com"
      },
      "branch": {
        "name": "Sede Centro",
        "address": "Calle 123"
      }
    }
  ]
}
\`\`\`

### POST /api/classes

Crear nueva clase (solo Admin/Coach).

**Request Body:**
\`\`\`json
{
  "name": "Nueva Clase",
  "description": "Descripción de la clase",
  "startTime": "2024-01-01T18:00:00Z",
  "endTime": "2024-01-01T19:00:00Z",
  "capacity": 20,
  "instructorId": "instructor_id",
  "branchId": "branch_id",
  "recurring": {
    "frequency": "weekly",
    "daysOfWeek": [1, 3, 5], // Lunes, Miércoles, Viernes
    "endDate": "2024-12-31T00:00:00Z"
  }
}
\`\`\`

### POST /api/classes/[id]/enroll

Inscribirse a una clase.

**Response:**
\`\`\`json
{
  "success": true,
  "enrollment": {
    "id": "enrollment_id",
    "classId": "class_id",
    "userId": "user_id",
    "status": "CONFIRMED",
    "enrolledAt": "2024-01-01T12:00:00Z"
  }
}
\`\`\`

### DELETE /api/classes/[id]/enroll

Cancelar inscripción a una clase.

## Endpoints de Pagos (Odoo Integration)

### GET /api/billing/odoo/acquirers

Obtener métodos de pago disponibles desde Odoo.

**Response:**
\`\`\`json
{
  "acquirers": [
    {
      "id": 1,
      "name": "Stripe",
      "provider": "stripe",
      "state": "enabled"
    },
    {
      "id": 2,
      "name": "PayPal",
      "provider": "paypal",
      "state": "enabled"
    }
  ]
}
\`\`\`

### POST /api/billing/odoo/create-payment-link

Crear enlace de pago en Odoo.

**Request Body:**
\`\`\`json
{
  "planId": "plan_id",
  "acquirerId": 1
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "paymentUrl": "https://odoo.com/payment/link/abc123",
  "transactionId": "trans_123"
}
\`\`\`

### GET /api/billing/odoo/transaction-status/[id]

Verificar estado de transacción.

**Response:**
\`\`\`json
{
  "transactionId": "trans_123",
  "status": "completed",
  "amount": 29.99,
  "currency": "USD",
  "completedAt": "2024-01-01T12:00:00Z"
}
\`\`\`

## Endpoints de KPIs

### GET /api/admin/kpis

Obtener métricas de la academia.

**Query Parameters:**
- `period` (opcional): "monthly" | "yearly" (default: "monthly")
- `startDate` (opcional): Fecha inicio (YYYY-MM-DD)
- `endDate` (opcional): Fecha fin (YYYY-MM-DD)

**Response:**
\`\`\`json
{
  "financial": {
    "mrr": 2500.00,
    "arpu": 35.50,
    "churnRate": 5.2,
    "ltv": 420.00
  },
  "students": {
    "total": 150,
    "active": 142,
    "new": 12,
    "churned": 8,
    "atRisk": 15
  },
  "classes": {
    "totalClasses": 45,
    "averageAttendance": 85.5,
    "occupancyRate": 78.2
  },
  "revenue": {
    "thisMonth": 2500.00,
    "lastMonth": 2350.00,
    "growth": 6.4
  }
}
\`\`\`

## Endpoints de Currículum

### GET /api/curriculum

Obtener currículum de la academia.

**Response:**
\`\`\`json
{
  "disciplines": [
    {
      "id": "discipline_id",
      "name": "Karate",
      "description": "Arte marcial tradicional",
      "levels": [
        {
          "id": "level_id",
          "name": "Cinturón Blanco",
          "order": 1,
          "requirements": ["Kata básico", "Técnicas fundamentales"],
          "content": [
            {
              "id": "content_id",
              "title": "Posiciones básicas",
              "type": "video",
              "url": "https://...",
              "duration": 300
            }
          ]
        }
      ]
    }
  ]
}
\`\`\`

### POST /api/curriculum

Crear nuevo contenido curricular (solo Admin).

### GET /api/student/progress

Obtener progreso del estudiante actual.

**Response:**
\`\`\`json
{
  "currentLevel": {
    "id": "level_id",
    "name": "Cinturón Amarillo",
    "progress": 75.5
  },
  "completedContent": [
    {
      "contentId": "content_id",
      "completedAt": "2024-01-01T12:00:00Z",
      "score": 85
    }
  ],
  "nextAssessment": {
    "id": "assessment_id",
    "name": "Examen Cinturón Naranja",
    "scheduledDate": "2024-02-01T10:00:00Z"
  }
}
\`\`\`

## Webhooks

### POST /api/odoo/payment

Webhook para confirmación de pagos desde Odoo.

**Headers:**
\`\`\`http
X-Odoo-Signature: sha256=<hmac-signature>
Content-Type: application/json
\`\`\`

**Request Body:**
\`\`\`json
{
  "event": "payment.confirmed",
  "data": {
    "transactionId": "trans_123",
    "amount": 29.99,
    "currency": "USD",
    "partnerId": 456,
    "reference": "ACADEMY-123456789"
  }
}
\`\`\`

### POST /api/odoo/sync

Sincronización manual con Odoo.

**Request Body:**
\`\`\`json
{
  "syncType": "full", // "full" | "incremental"
  "entities": ["users", "plans", "subscriptions"] // opcional
}
\`\`\`

## Códigos de Error

### 400 Bad Request
\`\`\`json
{
  "error": "Validation failed",
  "details": {
    "email": "Invalid email format",
    "password": "Password too short"
  }
}
\`\`\`

### 401 Unauthorized
\`\`\`json
{
  "error": "Authentication required"
}
\`\`\`

### 403 Forbidden
\`\`\`json
{
  "error": "Insufficient permissions",
  "required": "ACADEMY_ADMIN",
  "current": "STUDENT"
}
\`\`\`

### 404 Not Found
\`\`\`json
{
  "error": "Resource not found",
  "resource": "User",
  "id": "user_123"
}
\`\`\`

### 429 Too Many Requests
\`\`\`json
{
  "error": "Rate limit exceeded",
  "retryAfter": 60
}
\`\`\`

### 500 Internal Server Error
\`\`\`json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
\`\`\`

## Rate Limits

- **Autenticación**: 5 intentos por minuto por IP
- **API General**: 100 requests por minuto por usuario
- **Webhooks**: 1000 requests por minuto por IP
- **File Upload**: 10 uploads por minuto por usuario

## Paginación

Todas las rutas que retornan listas soportan paginación:

**Query Parameters:**
- `page`: Número de página (default: 1)
- `limit`: Elementos por página (default: 10, max: 100)

**Response Format:**
\`\`\`json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "pages": 15,
    "hasNext": true,
    "hasPrev": false
  }
}
