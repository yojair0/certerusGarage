# Guía de Integración Frontend - Citas (Appointments)

## 📌 Flujo de Creación y Visualización de Citas

Este documento detalla cómo funciona el backend para el módulo de citas, para ayudar a depurar por qué las citas podrían no aparecer en el panel del mecánico.

### 1. Crear Cita (Cliente) -> `POST /appointments`
Cuando un cliente agenda una cita:
1.  Se guarda en base de datos con estado **`pending`**.
2.  Se crea una notificación para el mecánico.
3.  **Respuesta:** El backend devuelve el objeto `Appointment` completo (incluyendo `client`, `mechanic`, `vehicle`, `schedule`).

### 2. Listar Citas (Mecánico/Cliente) -> `GET /appointments`

Este es el endpoint crítico. El backend devuelve citas según el rol del usuario que hace la petición (token JWT).

**URL:** `GET /appointments`
**Headers:** `Authorization: Bearer <token>`

#### Parámetros de Cita (Query Params opcionales):
Puedes filtrar la lista enviando estos parámetros en la URL. **Si envías un filtro, el backend solo devolverá lo que coincida.**

| Parámetro | Ejemplo | Descripción |
| :--- | :--- | :--- |
| `status` | `?status=pending` | Filtra por estado: `pending`, `accepted`, `rejected`. **¡Cuidado!** Si el frontend envía `status=accepted`, el mecánico NO verá las nuevas solicitudes. |
| `date` | `?date=2026-01-22` | Filtra por fecha específica. |
| `clientId` | `?clientId=5` | (Solo mecánicos) Ver citas de un cliente específico. |

#### 💡 Posibles causas de "No veo la cita":

1.  **Filtros Ocultos:** ¿El frontend está llamando a `/appointments?status=accepted` por defecto? Si es así, las citas nuevas (`pending`) no se verán.
    *   *Solución:* El mecánico debería tener una pestaña de "Solicitudes" que llame a `/appointments?status=pending` o llamar a `/appointments` sin filtros y separar en el front.

2.  **Fechas:** ¿El frontend está filtrando por la fecha de hoy (`?date=...`)?
    *   Si agendé para mañana, no saldrá en la lista de hoy.

3.  **Rol Incorrecto:** Asegurarse de que el usuario logueado tenga `role: 'mechanic'`.

### 3. Aceptar/Rechazar Cita (Mecánico) -> `PATCH /appointments/:id`

Para cambiar el estado de una cita.

**URL:** `PATCH /appointments/123`
**Body (JSON):**
```json
{
  "status": "accepted" // o "rejected"
}
```

---

## 🔍 Debugging Backend

Hemos activado logs en el servidor. Si entras a los logs de Render y filtras por `AppointmentsController`, verás exactamente qué filtros está enviando el frontend:

```text
📥 Obtener citas para: mecanico@ejemplo.com
   Filtros -> status: undefined, date: 2026-01-22  <-- ¡Revisar esto!
✅ Se encontraron 0 citas
```
