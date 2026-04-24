# Variables de entorno

El proyecto necesita **5 variables de entorno** para funcionar correctamente. Se definen en un fichero `.env.local` en la raíz del proyecto (nunca se sube al repositorio).

---

## Variables del frontend (Vercel)

| Variable | Ámbito | Obligatoria | Descripción |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | Cliente + Servidor | No* | URL base del backend REST. Si no se define, se usa `https://atalayas-backend-c25d.onrender.com/api/v1` como fallback. |
| `NEXT_PUBLIC_SUPABASE_URL` | Cliente + Servidor | Sí | URL del proyecto de Supabase. Se obtiene en Supabase → Settings → API. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cliente + Servidor | Sí | Clave anónima pública de Supabase. Se obtiene en el mismo lugar. |
| `BACKEND_URL` | Solo servidor | No* | URL base del backend para las llamadas internas de servidor (chatbot proxy). Fallback igual que `NEXT_PUBLIC_API_URL`. |

> **\* `NEXT_PUBLIC_API_URL` y `BACKEND_URL`** son opcionales solo si el backend de producción sigue siendo el de Render. En desarrollo local define ambas apuntando a tu instancia local.

## Variables del backend (Render)

Las claves de IA **ya no están en Vercel**. Deben configurarse en el panel de Render del servicio backend:

| Variable | Descripción |
|---|---|
| `GOOGLE_GEMINI_API_KEY` | Clave de Google AI Studio para Gemini 2.0 Flash. Consola: [aistudio.google.com](https://aistudio.google.com). |
| `GROQ_API_KEY` | Clave de Groq Cloud para llama-3.3-70b (fallback). Consola: [console.groq.com](https://console.groq.com). |

---

## Diferencia entre variables públicas y de servidor

- **Variables con `NEXT_PUBLIC_`**: Next.js las incluye en el bundle del cliente. Son visibles en el navegador. Úsalas solo para valores que no sean secretos (URLs de servicios públicos, claves anónimas de Supabase).
- **Variables sin `NEXT_PUBLIC_`**: Solo disponibles en el servidor (rutas de API, funciones de servidor). Nunca llegan al navegador. Úsalas para claves secretas como las de Gemini o Groq.

---

## Dónde se usan

| Variable | Fichero |
|---|---|
| `NEXT_PUBLIC_API_URL` | `lib/api.ts` |
| `NEXT_PUBLIC_SUPABASE_URL` | `lib/supabase.ts` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `lib/supabase.ts` |
| `BACKEND_URL` | `app/api/chat/route.ts` (proxy del chatbot) |

---

## Qué falla si no están definidas

| Variable ausente | Consecuencia |
|---|---|
| `NEXT_PUBLIC_API_URL` | Se usa la URL de producción por defecto. En desarrollo, las peticiones REST irán al backend de Render en lugar del local. |
| `NEXT_PUBLIC_SUPABASE_URL` | La subida de imágenes de portada de módulos fallará con un error de cliente. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | La subida de imágenes de portada de módulos fallará con un error de autenticación. |
| `BACKEND_URL` | El proxy del chatbot usará la URL de producción de Render por defecto. En desarrollo apuntar a la instancia local. |
| `GOOGLE_GEMINI_API_KEY` *(en Render)* | El backend intentará usar Gemini, fallará y pasará automáticamente a Groq. |
| `GROQ_API_KEY` *(en Render)* | Si Gemini también falla, el chatbot devolverá un error `⚠️ El servicio de IA no está disponible`. |

---

## Plantilla `.env.local` (Vercel / desarrollo local)

Crea este fichero en la raíz del proyecto y rellena los valores:

```bash
# Backend REST (usado por el cliente y el servidor de Next.js)
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1

# Backend URL para llamadas internas de servidor (proxy del chatbot)
# Puede coincidir con NEXT_PUBLIC_API_URL o apuntar a otra URL/puerto
BACKEND_URL=http://localhost:3001/api/v1

# Supabase (obtener en: Project Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> **Las claves de IA (`GOOGLE_GEMINI_API_KEY`, `GROQ_API_KEY`) ya no van aquí.**
> Configúralas en el panel de Render del servicio backend:
> **Render → tu servicio backend → Environment**.

> **Importante:** El fichero `.env.local` está incluido en `.gitignore` por defecto en Next.js. Nunca lo subas al repositorio. Comparte las claves con el equipo por un canal seguro.

