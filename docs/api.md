# API — Referencia de endpoints

## Wrapper `apiFetch`

Toda llamada al backend debe hacerse a través de `apiFetch` (`lib/api.ts`). Nunca uses `fetch` directamente para llamadas al backend.

```ts
import { apiFetch, API_URL } from "@/lib/api"

const res = await apiFetch(`${API_URL}/modulos`)
```

`apiFetch` añade automáticamente:
- `credentials: "include"` → envía la cookie de sesión.
- `Authorization: Bearer <token>` → si existe `accessToken` en `localStorage`.
- `Content-Type: application/json` → en todas las peticiones.

### URL base

```ts
// lib/api.ts
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "https://atalayas-backend-c25d.onrender.com/api/v1"
```

En producción se puede sobreescribir con la variable de entorno `NEXT_PUBLIC_API_URL`.

---

## Autenticación (`/auth`)

| Método | Endpoint | Descripción | Función |
|---|---|---|---|
| `GET` | `/auth/me` | Devuelve los datos del usuario autenticado a partir de la cookie/token. Devuelve 401 si no hay sesión. | `AuthContext` (directo) |
| `POST` | `/auth/logout` | Cierra la sesión en el servidor e invalida la cookie. | `AuthContext.logout()` |

---

## Módulos de formación (`/modulos`)

Definidas en `lib/api/modulos.ts`.

| Método | Endpoint | Descripción | Función |
|---|---|---|---|
| `GET` | `/modulos` | Lista los módulos visibles para el usuario autenticado. El backend filtra por empresa y rol automáticamente. | `getModulos()` |

### Función combinada: `getModulosConProgreso()`

No es un endpoint en sí, sino una función que llama en paralelo a `/modulos` y `/progreso/me` y combina los resultados para añadir el campo `status` (`"completado"`, `"en progreso"`, `"pendiente"`) a cada módulo.

---

## Progreso (`/progreso`)

Definidas en `lib/api/modulos.ts` y `lib/api/progreso.ts`.

| Método | Endpoint | Descripción | Función |
|---|---|---|---|
| `GET` | `/progreso/me` | Devuelve todos los registros de progreso del usuario autenticado. | `getMiProgreso()` |
| `POST` | `/progreso` | Crea o actualiza el progreso de un contenido. Se llama al abrir o completar un módulo. | `registrarProgreso(payload)` |
| `GET` | `/progreso/empresa/:empresaId` | Devuelve el progreso de todos los empleados de una empresa. Solo visible para admins. | `getProgresoEmpresa(empresaId)` |

### Payload de `registrarProgreso`

```ts
{
  usuarioId:       string   // ID del usuario
  contenidoId:     string   // ID del contenido dentro del módulo
  empresaId:       string   // ID de la empresa
  tiempoSegundos:  number   // Tiempo que lleva el usuario en el contenido
  completado:      boolean  // true si ha completado el contenido
}
```

---

## Anuncios / Noticias (`/anuncios`)

Definidas en `lib/api/noticias.ts`.

| Método | Endpoint | Descripción | Función |
|---|---|---|---|
| `GET` | `/anuncios` | Lista todos los anuncios. Se puede filtrar por empresa con `?empresaId=`. | `getNoticias(empresaId?)` |
| `POST` | `/anuncios` | Crea un nuevo anuncio. | `crearNoticia(data)` |
| `PUT` | `/anuncios/:id` | Edita un anuncio existente. | `editarNoticia(id, data)` |
| `PATCH` | `/anuncios/:id/desactivar` | Desactiva un anuncio (no lo elimina). | `desactivarNoticia(id)` |

### Tipo `NoticiaInput` (payload de creación/edición)

```ts
{
  titulo:     string
  contenido:  string
  esGlobal:   boolean         // true = visible para todas las empresas
  empresaId?: string | null   // null si es global
}
```

---

## Empresas (`/empresas`)

Definidas en `lib/api/empresas.ts`. Solo accesibles para el superadmin.

| Método | Endpoint | Descripción | Función |
|---|---|---|---|
| `GET` | `/empresas` | Lista todas las empresas registradas. | `getEmpresas()` |
| `PATCH` | `/empresas/:id/estado` | Cambia el estado de solicitud de una empresa (`PENDIENTE`, `APROBADA`, `RECHAZADA`). | `actualizarEstadoEmpresa(id, estado)` |
| `PATCH` | `/empresas/:id/solicitud` | Rechaza una solicitud de empresa pendiente. | `rechazarSolicitudEmpresa(id)` |
| `PATCH` | `/empresas/:id/activacion` | Activa o desactiva una empresa ya aprobada (toggle). | `toggleActivacionEmpresa(id)` |

---

## Notificaciones (`/notificaciones`)

Llamadas realizadas directamente desde `Header.tsx`, sin función auxiliar en `lib/api/`.

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/notificaciones/me/contador` | Devuelve `{ noLeidas: number }`. Se consulta cada 30 segundos mediante polling. |
| `PATCH` | `/notificaciones/me/leer-todas` | Marca todas las notificaciones del usuario como leídas. |

---

## Gestión de errores

Todas las funciones de `lib/api/` siguen el mismo patrón:

```ts
const res = await apiFetch(`${API_URL}/endpoint`)
if (!res.ok) throw new Error("Mensaje de error descriptivo")
return res.json()
```

Los componentes que llaman a estas funciones deben capturar el error con `try/catch` y mostrar feedback al usuario.

