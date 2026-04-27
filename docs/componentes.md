# Componentes

Inventario de todos los componentes del proyecto, agrupados por carpeta. Para cada uno se indica su propósito, las props que acepta y notas de uso relevantes.

---

## `components/` (raíz)

### `Header.tsx`

Cabecera global de la aplicación, presente en el dashboard y en el área del superadmin.

**Comportamiento:**
- Detecta si el usuario es superadmin (`codigoRol === "ROLE_ADMIN"`) y cambia los enlaces de navegación en consecuencia.
- En escritorio muestra los enlaces horizontalmente. En móvil, los oculta tras un menú hamburguesa.
- Muestra el contador de notificaciones no leídas con polling cada 30 segundos.
- El logo, el enlace de perfil y la campana de notificaciones apuntan a rutas distintas según el rol.

| Prop | Tipo | Descripción |
|---|---|---|
| `logoEmpresa?` | `string` | URL del logo de la empresa para mostrar en el avatar. Opcional. |

**Incluye internamente:** `NavButton` (botón de navegación con animación de subrayado), `UserMenu`, `NotifMenu`.

---

### `ModuloForm.tsx`

Formulario para **crear o editar** un módulo formativo. Lo usa el admin de empresa desde la sección de administración.

| Prop | Tipo | Descripción |
|---|---|---|
| `editando?` | `{ moduloId, nombre, descripcion, tipoModulo } \| null` | Si se pasa, el formulario se pre-rellena para edición. Si es `null` o `undefined`, es un formulario de creación. |
| `empresaId` | `string \| undefined` | ID de la empresa a la que pertenece el módulo. |
| `onSave` | `() => void` | Callback que se llama al guardar correctamente. |
| `onCancel` | `() => void` | Callback que se llama al cancelar. |

**Tipos de módulo disponibles:** `IDENTIDAD`, `BASICA`, `ESPECIFICA`, `DESARROLLO`, `RECOMPENSAS`, `COMUNIDAD`. Ver `lib/types/modulos.ts`.

---

## `components/auth/`

### `SuperAdminRoute.tsx`

Componente de **guard de rol** para el área del superadmin. Envuelve el contenido de las páginas que solo debe ver `ROLE_ADMIN`.

- Si no hay usuario → redirige a `/login`.
- Si el rol no es `ROLE_ADMIN` → redirige a `/dashboard`.
- Si el usuario tiene el rol correcto → renderiza `children`.

| Prop | Tipo | Descripción |
|---|---|---|
| `children` | `ReactNode` | Contenido a proteger. |

---

## `components/ui/`

### `ChatbotIA.tsx`

El asistente IA AtalaIA. Componente flotante disponible en todo el dashboard. Ver [chatbot-ia.md](./chatbot-ia.md) para la documentación completa.

**No tiene props externas.** Lee el usuario del `AuthContext` y los módulos directamente desde la API.

---

### `Header.tsx` → ver sección de raíz arriba.

---

### `UserMenu.tsx`

Menú desplegable del usuario en la esquina superior derecha del header. Muestra el nombre, empresa y opciones de navegación.

| Prop | Tipo | Descripción |
|---|---|---|
| `nombreMostrado` | `string` | Nombre del usuario a mostrar. |
| `empresaNombre?` | `string` | Nombre de la empresa. |
| `initials` | `string` | Iniciales del usuario (para el avatar). |
| `logoEmpresa?` | `string` | URL del logo de empresa. |
| `avatarUrl?` | `string` | URL de la foto de perfil del usuario. |
| `onPerfil` | `() => void` | Navega al perfil. |
| `onConfiguracion` | `() => void` | Navega a configuración. |
| `onCerrarSesion` | `() => void` | Cierra la sesión. |

**Animaciones:** usa GSAP para la animación de entrada/salida del dropdown.

---

### `NotifMenu.tsx`

Campana de notificaciones en el header. Muestra el contador de notificaciones no leídas y permite marcarlas todas como leídas.

| Prop | Tipo | Descripción |
|---|---|---|
| `noLeidas` | `number` | Número de notificaciones no leídas. |
| `onVerTodas` | `() => void` | Navega a la sección de notificaciones/comunicación. |
| `onMarcarLeidas` | `() => void` | Marca todas como leídas. |

**Animaciones:** usa GSAP para la animación de entrada del dropdown y de las tarjetas internas.

---

### `DashboardHero.tsx`

Banner hero reutilizable para las páginas del dashboard. Muestra una imagen de fondo con degradado oscuro y un título tipográfico.

| Prop | Tipo | Descripción |
|---|---|---|
| `prefijo?` | `string` | Texto en Poppins bold, antes del título principal. Ej: `"Centro de "` |
| `titulo` | `string` | Texto principal en Instrument Serif italic. Ej: `"Formación."` |
| `imagenFondo?` | `string` | Ruta relativa a `/public`. Por defecto: `/background-dashboard.jpg`. |

Muestra el nombre del usuario autenticado (obtenido del `AuthContext`).

---

### `Button.tsx`

Botón genérico reutilizable con variantes de estilo.

---

### `ComunicadosCarousel.tsx`

Carrusel de comunicados/anuncios. Se usa en la sección de comunicación del empleado.

---

### `FooterCTA.tsx`

Sección de llamada a la acción para el pie de las páginas públicas.

---

### `GradientText.tsx`

Componente de texto con gradiente de color. Se usa en títulos de la landing y páginas de presentación.

---

### `Grainient.tsx`

Fondo animado con gradiente + efecto de grano (noise). Se usa en el header del chatbot. Renderiza un canvas WebGL usando la librería OGL.

| Prop | Tipo | Descripción |
|---|---|---|
| `color1`, `color2`, `color3` | `string` | Colores en hexadecimal del gradiente animado. |
| `timeSpeed` | `number` | Velocidad de animación temporal. |
| `warpSpeed` | `number` | Velocidad del efecto de distorsión (warp). |
| `warpStrength` | `number` | Intensidad de la distorsión. |
| `contrast` | `number` | Contraste del gradiente. |
| `saturation` | `number` | Saturación del gradiente. |
| `grainAmount` | `number` | Cantidad de grano (0 = sin grano, 1 = máximo). |
| `style?` | `CSSProperties` | Estilos en línea del contenedor canvas. |

---

### `LineWaves.tsx`

Animación de ondas de líneas. Usada como elemento decorativo en fondos de sección.

---

### `LogoLoop.tsx`

Carrusel infinito de logos de empresa. Se usa en la landing para mostrar las empresas del área empresarial.

---

### `SplitText.tsx`

Componente que divide un texto en letras/palabras para animar su entrada de forma escalonada.

---

### `WaveDivider.tsx`

Separador decorativo en forma de ola entre secciones de página.

---

## `components/pages/`

Componentes de "página completa" que encapsulan la lógica y presentación de una sección entera. Son importados directamente por los `page.tsx` de Next.js.

| Componente | Sección | Descripción |
|---|---|---|
| `AdminEmpresa.tsx` | `/dashboard/admin` | Panel del admin de empresa: resumen de usuarios, anuncios y progreso de módulos. |
| `AdminGeneral.tsx` | Superadmin | Vista general de administración global. |
| `Empleado.tsx` | Dashboard empleado | Vista principal del empleado con sus módulos y progreso. |
| `GestionEmpresas.tsx` | `/superadmin/empresas` | Tabla de gestión de empresas con acciones de aprobar, rechazar y activar/desactivar. |
| `Invitado.tsx` | Landing invitado | Vista reducida de la plataforma para usuarios no registrados. |
| `Landing.tsx` | `/` | Landing pública completa con presentación de la plataforma. |
| `Login.tsx` | `/login` | Formulario de login con validación. |
| `Noticias.tsx` | `/dashboard/noticias` | Lista de anuncios con opción de creación/edición para admins. |
| `RegisterEmpresa.tsx` | `/register-empresa` | Formulario de solicitud de alta de empresa. |
| `SolicitudesPendientes.tsx` | `/superadmin/solicitudes` | Lista de solicitudes de empresa pendientes de revisión. |

