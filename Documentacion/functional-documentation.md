# Documentación Funcional

## Flujos de Usuario

### 1. Onboarding de Academia (Academy Admin)

#### Paso 1: Conexión con Odoo
- Configuración de credenciales de Odoo
- Verificación de conexión
- Sincronización inicial de datos

#### Paso 2: Datos de la Academia
- Información básica (nombre, descripción, contacto)
- Configuración de zona horaria
- Datos de contacto y redes sociales

#### Paso 3: Branding (Obligatorio)
- Selección de colores primarios y secundarios
- Carga de logo y favicon
- Verificación de contraste WCAG
- Vista previa en tiempo real

#### Paso 4: Configuración de Sedes
- Creación de sedes/sucursales
- Dirección y datos de contacto
- Horarios de operación
- Capacidad máxima por sede

#### Paso 5: Planes y Precios
- Sincronización con productos de Odoo
- Configuración de planes de suscripción
- Definición de acceso a contenido por plan

#### Paso 6: Revisión y Activación
- Resumen de configuración
- Activación de la academia
- Acceso completo a la plataforma

### 2. Gestión de Estudiantes (Academy Admin)

#### Dashboard Principal
- KPIs financieros (MRR, ARPU, Churn)
- Métricas de estudiantes activos
- Gráficos de ingresos y crecimiento
- Alertas de estudiantes en riesgo

#### Gestión de Membresías
- Lista de estudiantes activos/inactivos
- Historial de pagos y suscripciones
- Gestión de planes y upgrades
- Recuperación de pagos fallidos

#### Análisis y Reportes
- Reportes de asistencia por clase
- Análisis de ocupación por sede
- Métricas de retención de estudiantes
- Exportación de datos

### 3. Portal del Estudiante

#### Dashboard Personal
- Estado de membresía actual
- Próximas clases programadas
- Progreso en el currículum
- Historial de asistencia

#### Gestión de Pagos
- Información del plan actual
- Historial de pagos
- Actualización de métodos de pago
- Upgrade/downgrade de planes

#### Reserva de Clases
- Calendario de clases disponibles
- Reserva y cancelación de clases
- Lista de espera para clases llenas
- Confirmación por QR code

#### Contenido Educativo
- Acceso a videos por nivel
- Seguimiento de progreso
- Evaluaciones y certificaciones
- Descarga de materiales

### 4. Gestión de Clases (Coach)

#### Programación de Clases
- Creación de clases recurrentes
- Asignación de instructores
- Control de cupos y capacidad
- Gestión de lista de espera

#### Control de Asistencia
- Registro de asistencia por QR
- Marcado manual de asistencia
- Reportes de asistencia
- Seguimiento de estudiantes ausentes

#### Gestión de Contenido
- Asignación de lecciones por clase
- Evaluación de estudiantes
- Progreso por cinturón
- Certificaciones

## Características por Rol

### SuperAdmin
- Gestión global de academias
- Configuración de la plataforma
- Monitoreo de uso y performance
- Soporte técnico

### Academy Admin
- Configuración completa de la academia
- Gestión de sedes y planes
- Analytics y reportes
- Gestión de coaches y estudiantes
- Configuración de branding

### Coach
- Gestión de clases asignadas
- Control de asistencia
- Evaluación de estudiantes
- Acceso a contenido educativo

### Student
- Portal personal de estudiante
- Gestión de suscripción y pagos
- Reserva de clases
- Acceso a contenido por plan

### Guest
- Vista previa de la academia
- Información de planes
- Formulario de contacto
- Registro como estudiante

## Integraciones

### Odoo Integration
- **Productos**: Sincronización de planes de suscripción
- **Partners**: Gestión de usuarios y academias
- **Subscriptions**: Control de membresías activas
- **Payments**: Procesamiento completo de pagos
- **Invoicing**: Facturación automática
- **Webhooks**: Confirmación en tiempo real

### Notificaciones
- Email de confirmación de pagos
- Recordatorios de clases
- Alertas de vencimiento de suscripción
- Notificaciones de progreso

### Reportes y Analytics
- Exportación a PDF/Excel
- Dashboards interactivos
- Métricas en tiempo real
- Alertas automáticas
