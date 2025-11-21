# Funcionalidad "Recordarme" - Sesiones Persistentes

## Descripción General

Se ha implementado la funcionalidad "Recordarme" en el sistema de autenticación que permite a los usuarios mantener su sesión abierta por períodos extendidos, evitando tener que iniciar sesión cada vez que acceden a la aplicación.

## Funcionamiento

### Comportamiento según la opción seleccionada:

1. **CON "Recordarme" activado:**
   - La sesión permanece activa por **90 días (3 meses)**
   - La cookie de sesión persiste incluso después de cerrar el navegador
   - El usuario no necesita volver a iniciar sesión durante este período

2. **SIN "Recordarme" (por defecto):**
   - La sesión es temporal y se mantiene solo mientras el navegador está abierto
   - Al cerrar el navegador, la sesión se elimina automáticamente
   - Mayor seguridad para dispositivos compartidos

## Archivos Modificados

### 1. `/app/auth/signin/page.tsx`
- **Cambios:**
  - Agregado estado `rememberMe` para controlar el checkbox
  - Implementada lógica para guardar la preferencia en `localStorage`
  - Conectado el checkbox con el estado del componente

```typescript
const [rememberMe, setRememberMe] = useState(false)

// En handleSubmit:
if (rememberMe) {
  localStorage.setItem('rememberMe', 'true')
} else {
  localStorage.removeItem('rememberMe')
}
```

### 2. `/lib/auth.ts`
- **Cambios:**
  - Extendida la duración máxima de sesión de 30 a 90 días
  - Esto permite que las sesiones con "Recordarme" duren hasta 3 meses

```typescript
session: {
  strategy: "jwt",
  maxAge: 90 * 24 * 60 * 60, // 90 días (3 meses)
}
```

### 3. `/components/auth/SessionManager.tsx` (NUEVO)
- **Propósito:**
  - Componente que gestiona dinámicamente la duración de las cookies de sesión
  - Lee la preferencia de `localStorage` y ajusta las cookies en consecuencia
  
- **Lógica:**
  - Si `rememberMe === true`: Configura cookies con `max-age` de 90 días
  - Si `rememberMe === false`: Configura cookies de sesión (sin `max-age`)

### 4. `/components/providers.tsx`
- **Cambios:**
  - Agregado `<SessionManager />` dentro del `SessionProvider`
  - Esto asegura que la gestión de sesiones se aplique en toda la aplicación

## Seguridad

### Consideraciones de Seguridad:

1. **Tokens JWT:**
   - Los tokens siguen siendo seguros y firmados con `NEXTAUTH_SECRET`
   - La extensión de duración no compromete la seguridad del token

2. **Dispositivos Compartidos:**
   - Por defecto, la opción "Recordarme" está desactivada
   - Los usuarios deben activarla conscientemente
   - Recomendado solo para dispositivos personales

3. **Revocación de Sesiones:**
   - Las sesiones pueden ser revocadas desde el servidor si es necesario
   - Cambiar la contraseña invalida automáticamente todas las sesiones

## Uso para el Usuario

### Flujo de Login:

1. El usuario ingresa su email y contraseña
2. **Opcionalmente**, marca el checkbox "Recordarme"
3. Al hacer clic en "Iniciar Sesión":
   - Si marcó "Recordarme": La sesión durará 90 días
   - Si NO marcó: La sesión durará solo hasta cerrar el navegador

### Recomendaciones:

- ✅ **Activar "Recordarme"** en dispositivos personales (laptop, PC personal)
- ❌ **NO activar "Recordarme"** en dispositivos compartidos o públicos
- ❌ **NO activar "Recordarme"** en cibercafés o computadoras de trabajo compartidas

## Testing

### Para probar la funcionalidad:

1. **Test con "Recordarme" activado:**
   ```
   1. Iniciar sesión con el checkbox marcado
   2. Cerrar completamente el navegador
   3. Abrir el navegador nuevamente
   4. Navegar a la aplicación
   5. ✅ Deberías seguir autenticado
   ```

2. **Test sin "Recordarme":**
   ```
   1. Iniciar sesión SIN marcar el checkbox
   2. Cerrar completamente el navegador
   3. Abrir el navegador nuevamente
   4. Navegar a la aplicación
   5. ✅ Deberías ser redirigido al login
   ```

3. **Verificar cookies en DevTools:**
   ```
   - Abrir DevTools (F12)
   - Ir a Application > Cookies
   - Buscar: next-auth.session-token
   - Con "Recordarme": Verás una fecha de expiración (90 días)
   - Sin "Recordarme": Verás "Session" (sin fecha de expiración)
   ```

## Troubleshooting

### Problema: La sesión se cierra al cerrar el navegador (con "Recordarme" activado)

**Solución:**
1. Verificar que el checkbox esté correctamente marcado
2. Revisar en DevTools > Application > Local Storage que existe la clave `rememberMe` con valor `true`
3. Verificar en DevTools > Application > Cookies que la cookie tiene un `max-age` definido

### Problema: La sesión persiste sin haber marcado "Recordarme"

**Solución:**
1. Limpiar las cookies del navegador
2. Limpiar el localStorage
3. Volver a iniciar sesión

## Mejoras Futuras

Posibles mejoras a considerar:

1. **Opciones de duración personalizables:**
   - 7 días, 30 días, 90 días
   - Permitir al usuario elegir la duración

2. **Gestión de sesiones activas:**
   - Panel para ver todas las sesiones activas
   - Opción para cerrar sesiones remotamente

3. **Notificaciones de seguridad:**
   - Alertar al usuario cuando se detecta un login desde un nuevo dispositivo
   - Enviar email de confirmación para sesiones de larga duración

4. **Renovación automática:**
   - Renovar automáticamente el token antes de que expire
   - Mantener la sesión activa mientras el usuario esté activo

## Notas Técnicas

- **NextAuth.js** maneja automáticamente la renovación de tokens JWT
- Las cookies `next-auth.session-token` y `__Secure-next-auth.session-token` son las que controlan la sesión
- El componente `SessionManager` se ejecuta en el cliente y ajusta las cookies después del login
- La preferencia se guarda en `localStorage` para persistir entre recargas de página
