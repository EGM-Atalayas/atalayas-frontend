// lib/mocks/formaciones.mock.ts
import { Formacion } from "../types/formaciones";

export const MOCK_FORMACIONES: Formacion[] = [
  { 
    id: 1, 
    name: "Bienvenida y Valores", 
    category: "Onboarding", 
    status: "completado", 
    description: "Cultura corporativa, misión y visión de la empresa.",
    empresa_id: null 
  },
  { 
    id: 2, 
    name: "Prevención de Riesgos Laborales (PRL)", 
    category: "Básica", 
    status: "en progreso", 
    description: "Normativa de seguridad y salud en el puesto de trabajo.",
    empresa_id: null 
  },
  { 
    id: 3, 
    name: "Calidad y Medioambiente", 
    category: "Básica", 
    status: "pendiente", 
    description: "Protocolos de calidad e impacto medioambiental.",
    empresa_id: null 
  },
  { 
    id: 4, 
    name: "Manual Técnico de Operaciones", 
    category: "Específica", 
    status: "pendiente", 
    description: "Instrucciones detalladas de operatividad técnica.",
    empresa_id: "1" 
  },
  { 
    id: 5, 
    name: "Ciberseguridad Básica", 
    category: "Básica", 
    status: "pendiente", 
    description: "Protección de datos y buenas prácticas digitales.",
    empresa_id: null 
  },
];
