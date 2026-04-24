# Rutas de la aplicación

## Resumen general

| Tipo | Prefijo | Quién accede |
|---|---|---|
| Pública | `/` | Cualquiera (sin sesión) |
| Dashboard | `/dashboard` | Empleados y admins de empresa |
| Superadmin | `/superadmin` | Solo `ROLE_ADMIN` |

---

## Rutas públicas (`app/(public)/`)

No requieren sesión. Agrupadas con paréntesis para que Next.js no las incluya en la URL.

| Ruta | Página | Descripción |
|---|---|---|
| `/` | `(public)/page.tsx` | Landing pública con presentación de la plataforma. Accesible también para invitados. |
| `/login` | `(public)/login/` | Formulario de inicio de sesión. |
| `/register-empresa` | `(public)/register-empresa/` | Formulario de solicitud de alta de empresa. |
| `/reset-password` | `reset-password/page.tsx` | Pantalla de restablecimiento de contraseña. |

---

## Dashboard (`app/dashboard/`)

**Guard aplicado:** `app/dashboard/layout.tsx` comprueba la sesión antes de renderizar cualquier página. Si no hay sesión válida → redirige a `/login`. Si el rol es `INVITADO` → redirige a `/`.

| Ruta | Descripción | Quién la ve |
|---|---|---|
| `/dashboard` | Inicio del dashboard. Resumen del usuario. | `ROLE_EMPLEADO`, `ROLE_ADMIN_EMPRESA` |
| `/dashboard/formacion` | Lista de módulos formativos y progreso. | `ROLE_EMPLEADO`, `ROLE_ADMIN_EMPRESA` |
| `/dashboard/comunicacion` | Bandeja de comunicados internos. | `ROLE_EMPLEADO`, `ROLE_ADMIN_EMPRESA` |
| `/dashboard/admin` | Panel de administración de empresa: módulos, empleados, estadísticas. | Solo `ROLE_ADMIN_EMPRESA` (el backend protege el acceso a los datos) |
| `/dashboard/noticias` | Anuncios y noticias de la empresa. | `ROLE_EMPLEADO`, `ROLE_ADMIN_EMPRESA` |
| `/dashboard/onboarding` | Proceso de onboarding guiado. | `ROLE_EMPLEADO`, `ROLE_ADMIN_EMPRESA` |
| `/dashboard/perfil` | Perfil personal del usuario. | `ROLE_EMPLEADO`, `ROLE_ADMIN_EMPRESA` |
| `/dashboard/configuracion` | Ajustes de cuenta. | `ROLE_EMPLEADO`, `ROLE_ADMIN_EMPRESA` |

> **Nota:** La visibilidad de las secciones en el menú de navegación está controlada por `NAV_ITEMS_BY_ROLE` en `lib/routes.ts`. Un empleado no verá el enlace a "Administración" aunque la URL exista. La protección real de los datos sensibles la hace el backend.

---

## Superadmin (`app/superadmin/`)

**Guard aplicado:** `components/auth/SuperAdminRoute.tsx`. Si el usuario no tiene `codigoRol === "ROLE_ADMIN"`, es redirigido a `/dashboard`.

| Ruta | Descripción |
|---|---|
| `/superadmin` | Inicio del panel de superadministración. |
| `/superadmin/empresas` | Listado y gestión de todas las empresas. |
| `/superadmin/solicitudes` | Solicitudes de alta de empresa pendientes de revisión. |
| `/superadmin/estadisticas` | Estadísticas globales de uso de la plataforma. |
| `/superadmin/comunicados` | Gestión de comunicados globales (visibles para todas las empresas). |
| `/superadmin/configuracion` | Configuración del superadministrador. |

---

## Sistema de navegación por rol (`lib/routes.ts`)

El Header carga los enlaces de navegación dinámicamente según el rol del usuario.

```ts
// Rutas del dashboard
export const NAV_ROUTES: Record<string, string> = {
  "Inicio":         "/dashboard",
  "Formación":      "/dashboard/formacion",
  "Comunicación":   "/dashboard/comunicacion",
  "Administración": "/dashboard/admin",
}

// Qué ítems ve cada rol en el menú
export const NAV_ITEMS_BY_ROLE: Record<string, string[]> = {
  ROLE_EMPLEADO:      ["Inicio", "Formación", "Comunicación"],
  ROLE_ADMIN_EMPRESA: ["Inicio", "Formación", "Comunicación", "Administración"],
}
```

El superadmin (`ROLE_ADMIN`) usa una lista de enlaces propia definida directamente en `Header.tsx`:

```ts
const SUPERADMIN_LINKS = [
  { label: "Inicio",        path: "/superadmin" },
  { label: "Empresas",      path: "/superadmin/empresas" },
  { label: "Solicitudes",   path: "/superadmin/solicitudes" },
  { label: "Estadísticas",  path: "/superadmin/estadisticas" },
  { label: "Comunicados",   path: "/superadmin/comunicados" },
]
```

---

## Tabla de acceso completa

| Ruta | Sin sesión | INVITADO | ROLE_EMPLEADO | ROLE_ADMIN_EMPRESA | ROLE_ADMIN |
|---|---|---|---|---|---|
| `/` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/login` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/register-empresa` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/dashboard` | 🔄 `/login` | 🔄 `/` | ✅ | ✅ | ✅ |
| `/dashboard/admin` | 🔄 `/login` | 🔄 `/` | ⚠️ visible pero sin datos | ✅ | — |
| `/superadmin` | 🔄 `/login` | 🔄 `/login` | 🔄 `/dashboard` | 🔄 `/dashboard` | ✅ |

> **Leyenda:** ✅ Acceso permitido · 🔄 Redirige · ⚠️ Acceso a la URL pero el backend rechaza los datos · — No aplica

