# Arquitectura del proyecto

## Stack tecnológico

| Tecnología | Versión | Para qué se usa |
|---|---|---|
| **Next.js** | 16 (App Router) | Framework React con enrutado por carpetas, layouts anidados y rutas de API en el servidor |
| **TypeScript** | 5 | Tipado estático en todo el proyecto |
| **Tailwind CSS** | 4 | Clases de utilidad para los estilos. Se usa junto con estilos en línea para componentes complejos |
| **Supabase** | 2 | Se usa exclusivamente como **Storage** para subir imágenes de portada de módulos |
| **GSAP** | 3 | Animaciones de entrada en menús y componentes UI (NotifMenu, UserMenu) |
| **Motion** | 12 | Animaciones declarativas en componentes de página |
| **Google Gemini 2.0 Flash** | — | Modelo de IA principal del chatbot AtalaIA |
| **Groq llama-3.3-70b** | — | Modelo de IA de respaldo si Gemini falla |
| **jsPDF** | 4 | Generación de PDFs en el cliente |
| **Recharts** | 3 | Gráficas en el área de estadísticas del superadmin |
| **HLS.js** | 1 | Reproducción de vídeo en streaming en módulos formativos |
| **Lucide React** | 1 | Librería de iconos |

---

## Estructura de carpetas

```
atalayas-frontend/
├── app/                        # Rutas de la aplicación (Next.js App Router)
│   ├── layout.tsx              # Layout raíz: fuentes, AuthProvider
│   ├── globals.css             # Variables CSS globales (colores, tipografías)
│   ├── (public)/               # Grupo de rutas públicas (no requieren sesión)
│   │   ├── layout.tsx
│   │   ├── page.tsx            # Landing pública
│   │   ├── login/
│   │   └── register-empresa/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts        # Ruta de API del chatbot AtalaIA (servidor)
│   ├── dashboard/              # Área de empleados y admins de empresa
│   │   ├── layout.tsx          # Guard de sesión + Header + ChatbotIA
│   │   ├── page.tsx
│   │   ├── formacion/
│   │   ├── comunicacion/
│   │   ├── admin/
│   │   ├── configuracion/
│   │   ├── noticias/
│   │   ├── onboarding/
│   │   └── perfil/
│   ├── superadmin/             # Área exclusiva del superadministrador
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── empresas/
│   │   ├── solicitudes/
│   │   ├── estadisticas/
│   │   ├── comunicados/
│   │   └── configuracion/
│   └── reset-password/
├── components/                 # Componentes React reutilizables
│   ├── Header.tsx              # Cabecera global (adaptativa por rol)
│   ├── ModuloForm.tsx          # Formulario de creación/edición de módulos
│   ├── auth/
│   │   └── SuperAdminRoute.tsx # Guard de rol superadmin
│   ├── pages/                  # Componentes de página completos
│   └── ui/                     # Componentes de interfaz reutilizables
├── context/
│   └── AuthContext.tsx         # Estado global de sesión del usuario
├── lib/                        # Lógica de negocio y utilidades
│   ├── api.ts                  # apiFetch + API_URL base
│   ├── routes.ts               # Definición de rutas por rol
│   ├── supabase.ts             # Cliente Supabase + función de subida de imágenes
│   ├── ai/
│   │   └── provider.ts         # Proveedor de IA: Gemini y Groq
│   ├── api/                    # Funciones de llamada a la API por dominio
│   │   ├── modulos.ts
│   │   ├── noticias.ts
│   │   ├── progreso.ts
│   │   └── empresas.ts
│   └── types/                  # Tipos TypeScript compartidos
│       ├── modulos.ts
│       ├── noticias.ts
│       └── progreso.ts
└── public/                     # Imágenes estáticas, logos y fondos
```

---

## Convenciones del proyecto

### Nombrado de ficheros
- Componentes React → `PascalCase.tsx` (ej: `ChatbotIA.tsx`)
- Utilidades y tipos → `camelCase.ts` (ej: `api.ts`, `modulos.ts`)
- Rutas de Next.js → carpeta con `page.tsx` o `route.ts`

### Directiva `"use client"` / `"use server"`
- Los componentes con hooks de React, acceso al DOM o `localStorage` llevan `"use client"` en la primera línea.
- Las rutas de API (`app/api/`) y el proveedor de IA (`lib/ai/provider.ts`) son de servidor por defecto. `provider.ts` usa `import "server-only"` explícitamente para evitar importarlo accidentalmente en el cliente.

### Estilos
- **Tailwind** se usa para layout, espaciado, tipografía y responsive.
- **Variables CSS globales** (definidas en `globals.css`) para colores corporativos: `--azul-egm`, `--verde-oliva`, `--marino`, etc. Se aplican con `style={{ color: "var(--azul-egm)" }}`.
- Los componentes UI más complejos (ChatbotIA, NotifMenu) usan estilos en línea para control total de las animaciones.

### Gestión de datos
- No hay librería de estado global (Redux, Zustand, etc.). El estado se gestiona con React State + Context.
- Las llamadas a la API siempre pasan por el wrapper `apiFetch` de `lib/api.ts`. Nunca se usa `fetch` directamente para llamadas al backend.
- Los tipos de respuesta de la API se definen en `lib/types/` y los importan tanto los componentes como las funciones de `lib/api/`.

### Alias de importación
El alias `@/` apunta a la raíz del proyecto (configurado en `tsconfig.json`):
```ts
import { apiFetch } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"
```

