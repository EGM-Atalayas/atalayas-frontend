"use client";

// ============================================================
// BienvenidaTemplatePanel
// Panel que aparece cuando tipoModulo = ONBOARDING.
// Permite al admin rellenar datos de la empresa y generar
// automáticamente las páginas estándar del manual de bienvenida.
// ============================================================

import { useState } from "react";
import {
  ChevronDown, Check, Hand, Building2, Target, Users, Trophy,
  ClipboardList, CheckSquare, FileText, Megaphone,
} from "lucide-react";
import { IAButton } from "@/components/ui/IAButton";

// ── Tipos mínimos que necesitamos (deben coincidir con los del padre) ─────────
interface PreguntaPagina { texto: string; opciones: string[]; correcta: number; }
interface PaginaModulo {
  id: number; tipo: "texto" | "archivo" | "test";
  titulo: string; contenido: string;
  archivoUrl: string | null; archivoNombre: string | null; archivoFile: File | null;
  preguntas: PreguntaPagina[];
}

interface BienvenidaTemplatePanelProps {
  nombreEmpresa: string;          // pre-relleno desde usuario.nombreEmpresa
  onAplicar: (paginas: PaginaModulo[]) => void;
  newId: () => number;
}

// ── Secciones disponibles en el manual ────────────────────────────────────────
const SECCIONES: { key: string; label: string; icon: React.ReactNode; desc: string }[] = [
  { key: "bienvenida",    label: "Bienvenida",                  icon: <Hand        className="w-4 h-4" />, desc: "Mensaje de bienvenida y primeros pasos" },
  { key: "quienes_somos", label: "Quiénes somos",              icon: <Building2   className="w-4 h-4" />, desc: "Historia, qué hacemos y centro de trabajo" },
  { key: "mision_vision", label: "Misión, Visión y Valores",   icon: <Target      className="w-4 h-4" />, desc: "Filosofía y cultura de la empresa" },
  { key: "equipo",        label: "Equipo y liderazgo",         icon: <Users       className="w-4 h-4" />, desc: "Tus compañeros y responsables" },
  { key: "gestion",       label: "Gestión empresarial",        icon: <Trophy      className="w-4 h-4" />, desc: "Calidad, compromiso social y Plan de Igualdad" },
  { key: "normas",        label: "Normas de funcionamiento",   icon: <ClipboardList className="w-4 h-4" />, desc: "Jornada, horario, descansos y vacaciones" },
  { key: "pautas",        label: "Pautas que no debes olvidar",icon: <CheckSquare className="w-4 h-4" />, desc: "Actitud, valores y comportamiento esperado" },
  { key: "condiciones",   label: "Condiciones laborales",      icon: <FileText    className="w-4 h-4" />, desc: "Contrato, nómina, permisos y beneficios" },
  { key: "comunicacion",  label: "Canales de comunicación",    icon: <Megaphone   className="w-4 h-4" />, desc: "Buzón de ideas, tablón y portal del empleado" },
];

// ── Generador de contenido markdown por sección ───────────────────────────────
function generarContenido(key: string, datos: DatosPlantilla): string {
  const e = datos.empresa || "la empresa";
  const dir = datos.director || "el equipo directivo";
  const sector = datos.sector || "nuestro sector";
  const ciudad = datos.ciudad || "nuestra sede";
  const horario = datos.horario || "según lo indicado en tu contrato";
  const rrhh = datos.contactoRRHH || "el departamento de RRHH";
  const mision = datos.mision || `En ${e} trabajamos cada día para ofrecer lo mejor a nuestros clientes y colaboradores.`;
  const vision = datos.vision || `Ser referentes en ${sector}, reconocidos por nuestra calidad y compromiso.`;
  const valores = datos.valores || `Integridad, trabajo en equipo, innovación y respeto.`;

  switch (key) {
    case "bienvenida":
      return `## ¡Bienvenido/a a ${e}!

Es un placer darte la bienvenida. Desde hoy formas parte de nuestro equipo y queremos que tu incorporación sea lo más cómoda y fluida posible.

Este manual ha sido preparado para ayudarte a conocer nuestra empresa, entender cómo trabajamos y sentirte en casa desde el primer día.

### Tu primer día

- Llegarás a ${ciudad} donde te recibirá ${rrhh}
- Te presentaremos a tu equipo y te mostraremos tu puesto de trabajo
- Revisaremos juntos toda la documentación necesaria
- Te asignaremos las credenciales y accesos a los sistemas

> **Consejo:** No dudes en preguntar todo lo que necesites. Estamos aquí para ayudarte.`;

    case "quienes_somos":
      return `## ¿Quiénes somos?

${e} es una empresa dedicada a ${sector}. A lo largo de nuestra historia hemos construido una organización sólida basada en la confianza y el compromiso con nuestros clientes.

### Nuestra historia

Desde nuestros inicios${datos.anio ? ` en ${datos.anio}` : ""}, hemos crecido hasta convertirnos en una empresa de referencia en ${sector}. Cada etapa de nuestra evolución ha estado marcada por la innovación y la mejora continua.

### ¿Qué hacemos?

Nuestro trabajo se centra en ofrecer soluciones de calidad en ${sector}, siempre poniendo al cliente en el centro de todo lo que hacemos.

### Centro de trabajo

Nuestra sede principal está en **${ciudad}**. Contamos con instalaciones modernas y equipadas para que puedas desarrollar tu trabajo de manera óptima.`;

    case "mision_vision":
      return `## Filosofía de la Empresa

### Misión

${mision}

### Visión

${vision}

### Nuestros Valores

${valores}

---

Estos valores no son solo palabras: son la guía de nuestras decisiones y la base de cómo nos relacionamos entre nosotros y con el mundo exterior.

> Cada acción que realizamos refleja quiénes somos como empresa y como equipo.`;

    case "equipo":
      return `## Tu equipo

### Equipo de liderazgo

En ${e} contamos con un equipo directivo comprometido con el crecimiento de la empresa y el bienestar de todos los empleados. ${dir} lidera el equipo con una visión clara y valores firmes.

### Tus compañeros

Pronto conocerás a las personas con las que compartirás el día a día. Te animamos a presentarte, preguntar y participar activamente en la vida del equipo.

### Organigrama

El organigrama de la empresa está disponible en el **Portal del Empleado**, donde podrás ver la estructura de los equipos y encontrar información de contacto de tus compañeros y responsables.

> No esperes a que te presenten: da el primer paso y saluda a tus compañeros.`;

    case "gestion":
      return `## Gestión empresarial

### Compromiso con la calidad

En ${e} el compromiso con la calidad es un valor fundamental. Contamos con procesos y procedimientos diseñados para garantizar los más altos estándares en todo lo que hacemos.

### Certificados y reconocimientos

Nuestra empresa cuenta con certificaciones y reconocimientos que avalan nuestro compromiso con la excelencia. Pregunta a tu responsable por las certificaciones vigentes.

### Compromiso social

Creemos en nuestra responsabilidad con la sociedad y el medio ambiente. Participamos activamente en iniciativas de responsabilidad social corporativa.

### Plan de Igualdad

${e} dispone de un Plan de Igualdad que garantiza la igualdad de oportunidades entre todos los empleados, independientemente de su género, origen, edad o cualquier otra condición personal.

El Plan de Igualdad incluye medidas para:
- Igualdad retributiva
- Conciliación de la vida personal, laboral y familiar
- Prevención del acoso
- Promoción interna equitativa`;

    case "normas":
      return `## Normas de funcionamiento interno

### Jornada y períodos de descanso

Tu jornada laboral y los descansos correspondientes están establecidos en tu contrato y en el convenio colectivo aplicable.

### Horario de trabajo

- **Horario:** ${horario}
- Es importante cumplir el horario establecido y comunicar cualquier ausencia o retraso con la mayor antelación posible.

### Descansos

Tienes derecho a los descansos establecidos por ley y por el convenio colectivo. Utilízalos para reponer energías y mantener tu rendimiento.

### Vacaciones

Las vacaciones anuales se gestionan a través del **Portal del Empleado**. Coordina con tu responsable con la suficiente antelación para planificar los períodos de descanso.

### Días festivos

Los días festivos aplicables son los establecidos por el calendario laboral oficial y los del convenio colectivo de referencia.

### Detalles importantes

- Cualquier ausencia debe comunicarse lo antes posible a tu responsable y a ${rrhh}
- Las solicitudes de permisos y vacaciones se gestionan desde el Portal del Empleado`;

    case "pautas":
      return `## Pautas que no debes olvidar

Estas son las actitudes y comportamientos que esperamos de cada miembro del equipo:

### Contribuye
Aporta tus ideas y energía al equipo. Tu perspectiva es valiosa y queremos escucharla.

### Haz lo que sea necesario
Muestra proactividad. Si ves algo que se puede mejorar o que necesita atención, no esperes a que te lo pidan.

### Busca soluciones, no problemas
Cuando encuentres un obstáculo, llega con propuestas. La mentalidad soluciones-primero es parte de nuestra cultura.

### Llega temprano y siempre listo
La puntualidad refleja respeto por tus compañeros y clientes. Organiza tu tiempo para llegar preparado/a.

### Sé agradable y respetuoso
El respeto mutuo es la base de nuestro equipo. Trata a los demás como te gustaría ser tratado/a.

### Valora la singularidad y la diversidad
Cada persona aporta algo único. Celebramos las diferencias y aprendemos de ellas.

### Mantén tu apariencia pulcra
La imagen personal refleja la imagen de la empresa. Cuida tu presentación en el trabajo.

### Practica el liderazgo
Independientemente de tu posición, puedes liderar con el ejemplo, la actitud y la iniciativa.

### Aborda los problemas desde la fuente
Cuando surja un conflicto o problema, habla directamente con la persona implicada o con tu responsable. Evita comentarios indirectos.`;

    case "condiciones":
      return `## Condiciones laborales

### Contrato de trabajo
Tu contrato recoge todas las condiciones de tu relación laboral con ${e}. Si tienes dudas, consulta a ${rrhh}.

### Convenio colectivo
Las condiciones de trabajo están reguladas por el convenio colectivo aplicable a tu categoría profesional. Puedes consultarlo en ${rrhh} o en el Portal del Empleado.

### Desarrollo profesional
En ${e} apostamos por el crecimiento de nuestros empleados. Disponemos de planes de formación y desarrollo profesional para ayudarte a crecer.

### La nómina
Tu nómina se abona en los plazos indicados en tu contrato. Puedes consultarla y descargarla desde el **Portal del Empleado**.

### Prestaciones e incapacidad temporal
En caso de enfermedad o accidente, comunícalo a ${rrhh} lo antes posible. La gestión de la incapacidad temporal se realiza a través de la mutua colaboradora o del médico de empresa.

### Maternidad y/o paternidad
Tienes derecho a los permisos de maternidad y paternidad establecidos por la legislación vigente. Consulta a ${rrhh} para conocer todos los detalles y el proceso de solicitud.

### Permisos y conciliación
Dispones de los permisos establecidos por el convenio colectivo: matrimonio, hospitalización de familiares, nacimiento de hijos, etc. Solicítalos con antelación a través del Portal del Empleado.

### Beneficios médicos
Consulta con ${rrhh} los beneficios médicos disponibles para empleados de ${e}.

### Prevención de riesgos laborales
La seguridad en el trabajo es prioritaria. Recibirás formación en prevención de riesgos específica para tu puesto. Ante cualquier situación de riesgo, comunícalo a tu responsable inmediatamente.`;

    case "comunicacion":
      return `## Canales de comunicación

En ${e} valoramos la comunicación abierta y transparente. Estos son los canales que tienes a tu disposición:

### Buzón de ideas y sugerencias
¿Tienes una idea para mejorar algo? Usa el buzón de sugerencias disponible en el Portal del Empleado. Todas las ideas son bienvenidas y revisadas por la dirección.

### Reuniones de información
Periódicamente se realizan reuniones de equipo donde se comparten novedades, resultados y próximos objetivos. Tu responsable te informará del calendario.

### Tablón de anuncios
Consulta regularmente el tablón de anuncios (físico y digital) donde publicamos información de interés: eventos, noticias de la empresa, comunicados importantes...

### Portal del Empleado
Es tu herramienta principal. Desde aquí puedes:
- Consultar y descargar tu nómina
- Solicitar vacaciones y permisos
- Acceder a la formación disponible
- Comunicarte con ${rrhh}
- Ver tus datos personales y actualizar tu teléfono y correo

### Contacto directo
Para cualquier consulta o necesidad, puedes dirigirte directamente a:
- **Tu responsable directo**
- **${rrhh}**

> Recuerda: la comunicación abierta hace más fuerte a nuestro equipo.`;

    default:
      return "";
  }
}

// ── Tipos del formulario ──────────────────────────────────────────────────────
interface DatosPlantilla {
  empresa: string;
  director: string;
  sector: string;
  ciudad: string;
  anio: string;
  horario: string;
  contactoRRHH: string;
  mision: string;
  vision: string;
  valores: string;
}

// ── Componente principal ───────────────────────────────────────────────────────
export function BienvenidaTemplatePanel({ nombreEmpresa, onAplicar, newId }: BienvenidaTemplatePanelProps) {
  const [open, setOpen] = useState(false);
  const [aplicado, setAplicado] = useState(false);

  const [datos, setDatos] = useState<DatosPlantilla>({
    empresa:      nombreEmpresa || "",
    director:     "",
    sector:       "",
    ciudad:       "",
    anio:         "",
    horario:      "09:00 - 18:00",
    contactoRRHH: "el departamento de RRHH",
    mision:       "",
    vision:       "",
    valores:      "",
  });

  // Secciones seleccionadas (todas por defecto)
  const [seleccionadas, setSeleccionadas] = useState<Set<string>>(
    new Set(SECCIONES.map((s) => s.key))
  );

  const toggleSeccion = (key: string) => {
    setSeleccionadas((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const campo = (key: keyof DatosPlantilla) => (
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setDatos((d) => ({ ...d, [key]: e.target.value }))
  );

  const handleAplicar = () => {
    const paginas: PaginaModulo[] = SECCIONES
      .filter((s) => seleccionadas.has(s.key))
      .map((s) => ({
        id:           newId(),
        tipo:         "texto" as const,
        titulo:       s.label,
        contenido:    generarContenido(s.key, datos),
        archivoUrl:   null,
        archivoNombre: null,
        archivoFile:  null,
        preguntas:    [],
      }));
    onAplicar(paginas);
    setAplicado(true);
    setOpen(false);
  };

  return (
    <div
      className="rounded-2xl overflow-hidden mb-6 fade-up"
      style={{ background: "var(--blanco)", border: "1px solid #bbf7d0", boxShadow: "0 2px 16px rgba(0,0,0,0.06)" }}
    >
      {/* ── Header del panel ──────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 hover:opacity-90 transition-opacity"
        style={{
          background:   "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
          borderBottom: open ? "1px solid #bbf7d0" : "none",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "#16a34a", color: "#fff" }}
          >
            <ClipboardList className="w-4 h-4" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold" style={{ color: "#15803d" }}>Plantilla de Bienvenida</p>
            <p className="text-xs flex items-center gap-1" style={{ color: "#22c55e" }}>
              {aplicado && <Check className="w-3 h-3 shrink-0" />}
              {aplicado
                ? "Plantilla aplicada — puedes editar el contenido en las páginas"
                : "Genera el manual de incorporación en segundos con secciones predefinidas"}
            </p>
          </div>
        </div>
        <div
          className="transition-transform"
          style={{ transform: open ? "rotate(0deg)" : "rotate(-90deg)" }}
        >
          <ChevronDown style={{ color: "#16a34a" }} />
        </div>
      </button>

      {/* ── Cuerpo del panel ──────────────────────────────────────────────── */}
      {open && (
        <div className="px-6 py-5 flex flex-col gap-6">

          {/* Datos de la empresa */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--texto-muted)" }}>
              Datos de la empresa
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Nombre de la empresa" value={datos.empresa}      onChange={campo("empresa")}      placeholder="Empresa Demo S.L." />
              <Field label="Director/Responsable"  value={datos.director}    onChange={campo("director")}    placeholder="Nombre del director" />
              <Field label="Sector / Actividad"    value={datos.sector}      onChange={campo("sector")}      placeholder="Ej: logística, retail, industria..." />
              <Field label="Ciudad / Sede"         value={datos.ciudad}      onChange={campo("ciudad")}      placeholder="Ej: Valencia" />
              <Field label="Año de fundación"      value={datos.anio}        onChange={campo("anio")}        placeholder="Ej: 2010" />
              <Field label="Horario laboral"       value={datos.horario}     onChange={campo("horario")}     placeholder="Ej: 09:00 - 18:00" />
              <Field label="Contacto RRHH"         value={datos.contactoRRHH} onChange={campo("contactoRRHH")} placeholder="Ej: rrhh@empresa.com" />
            </div>
          </div>

          {/* Misión / Visión / Valores */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "var(--texto-muted)" }}>
              Filosofía (opcional — si no rellenas, se genera texto genérico)
            </p>
            <div className="flex flex-col gap-3">
              <TextareaField label="Misión"   value={datos.mision}  onChange={campo("mision")}  placeholder="¿Para qué existe la empresa? ¿Qué ofrece al mundo?" />
              <TextareaField label="Visión"   value={datos.vision}  onChange={campo("vision")}  placeholder="¿Dónde quiere llegar la empresa en el futuro?" />
              <TextareaField label="Valores"  value={datos.valores} onChange={campo("valores")} placeholder="Ej: Integridad, innovación, trabajo en equipo..." />
            </div>
          </div>

          {/* Secciones a incluir */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--texto-muted)" }}>
                Secciones a incluir ({seleccionadas.size} de {SECCIONES.length})
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSeleccionadas(new Set(SECCIONES.map((s) => s.key)))}
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-lg"
                  style={{ background: "#f0fdf4", color: "#15803d", border: "1px solid #bbf7d0" }}
                >
                  Todas
                </button>
                <button
                  type="button"
                  onClick={() => setSeleccionadas(new Set())}
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-lg"
                  style={{ background: "var(--gris-superficie)", color: "var(--texto-muted)", border: "1px solid var(--gris-borde)" }}
                >
                  Ninguna
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SECCIONES.map((s) => {
                const active = seleccionadas.has(s.key);
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => toggleSeccion(s.key)}
                    className="flex items-start gap-3 px-4 py-3 rounded-xl text-left transition-all"
                    style={{
                      border:     `1.5px solid ${active ? "#86efac" : "var(--gris-borde)"}`,
                      background: active ? "#f0fdf4" : "var(--gris-pagina)",
                    }}
                  >
                    <span
                      className="shrink-0 mt-0.5 flex items-center justify-center w-7 h-7 rounded-lg"
                      style={{ background: active ? "#bbf7d0" : "var(--gris-borde)", color: active ? "#15803d" : "var(--texto-muted)" }}
                    >
                      {s.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold leading-tight" style={{ color: active ? "#15803d" : "var(--texto-primario)" }}>
                        {s.label}
                      </p>
                      <p className="text-[11px] mt-0.5 leading-tight" style={{ color: "var(--texto-muted)" }}>
                        {s.desc}
                      </p>
                    </div>
                    <div
                      className="w-4 h-4 rounded shrink-0 mt-0.5 flex items-center justify-center"
                      style={{
                        background:  active ? "#16a34a" : "var(--blanco)",
                        border:      `1.5px solid ${active ? "#16a34a" : "var(--gris-borde)"}`,
                      }}
                    >
                      {active && (
                        <svg className="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none">
                          <path d="M1.5 5L4 7.5L8.5 2.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Botón aplicar */}
          <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: "var(--gris-borde)" }}>
            <p className="text-xs" style={{ color: "var(--texto-muted)" }}>
              Se crearán <strong>{seleccionadas.size}</strong> páginas con contenido listo para personalizar.
            </p>
            <IAButton
              size="md"
              onClick={handleAplicar}
              disabled={seleccionadas.size === 0}
            >
              Aplicar plantilla
            </IAButton>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helpers de campos ─────────────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder }: {
  label: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--texto-muted)" }}>
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full text-sm px-3 py-2.5 rounded-lg outline-none"
        style={{ border: "1.5px solid var(--gris-borde)", color: "var(--texto-primario)", background: "var(--gris-pagina)" }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "#16a34a")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "var(--gris-borde)")}
      />
    </div>
  );
}

function TextareaField({ label, value, onChange, placeholder }: {
  label: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--texto-muted)" }}>
        {label}
      </label>
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={2}
        className="w-full text-sm px-3 py-2.5 rounded-lg outline-none resize-none"
        style={{ border: "1.5px solid var(--gris-borde)", color: "var(--texto-primario)", background: "var(--gris-pagina)" }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "#16a34a")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "var(--gris-borde)")}
      />
    </div>
  );
}
