# Documentación — Atalayas Frontend

Bienvenido a la documentación técnica del frontend de **Atalayas Ciudad Empresarial**, la plataforma de onboarding y formación para las empresas del área empresarial de Alicante.

---

## Descripción del proyecto

Atalayas es una aplicación web que permite a las empresas gestionar el onboarding y la formación de sus empleados. Cada empresa tiene su propio espacio con módulos formativos, comunicados internos y seguimiento de progreso. Un superadministrador gestiona el alta de empresas y la plataforma de forma global.

## Stack resumido

| Tecnología | Uso |
|---|---|
| Next.js 16 (App Router) | Framework principal |
| TypeScript | Tipado estático |
| Tailwind CSS v4 | Estilos |
| Supabase | Storage de imágenes |
| GSAP + Motion | Animaciones |
| Google Gemini 2.0 Flash | IA del chatbot (primario) |
| Groq llama-3.3-70b | IA del chatbot (fallback) |

## Índice de documentación

| Fichero | Contenido |
|---|---|
| [arquitectura.md](./arquitectura.md) | Stack, estructura de carpetas y convenciones del proyecto |
| [autenticacion.md](./autenticacion.md) | Flujo de sesión, roles, guards y diagrama |
| [api.md](./api.md) | Todos los endpoints del backend consumidos |
| [chatbot-ia.md](./chatbot-ia.md) | Arquitectura de AtalaIA: componente, ruta de API y proveedor de IA |
| [rutas.md](./rutas.md) | Mapa de rutas de la app y acceso por rol |
| [componentes.md](./componentes.md) | Inventario de componentes con propósito y props |
| [variables-de-entorno.md](./variables-de-entorno.md) | Variables de entorno requeridas |

---

> **Nota de mantenimiento:** Los ficheros `api.md` y `rutas.md` son los que más cambian. Actualízalos cada vez que se añadan endpoints o rutas nuevas.

