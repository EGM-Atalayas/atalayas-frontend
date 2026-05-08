import React from "react";
import Link from "next/link";

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-16 px-6">
      <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-slate-100 text-slate-700">
        <div className="mb-8 border-b border-slate-100 pb-6">
          <Link href="/login" className="text-blue-600 hover:text-blue-800 text-sm font-semibold mb-4 inline-block">
            &larr; Volver
          </Link>
          <h1 className="text-3xl font-bold text-blue-950 mb-2">Política de Privacidad</h1>
          <p className="text-sm text-slate-500">Fecha de última actualización: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="space-y-6 text-sm leading-relaxed">
          <p>
            En cumplimiento de lo dispuesto en el Reglamento (UE) 2016/679 del Parlamento Europeo y del Consejo, de 27 de abril de 2016 (RGPD), y en la Ley Orgánica 3/2018, de 5 de diciembre, de Protección de Datos Personales y garantía de los derechos digitales (LOPDGDD), le informamos sobre el tratamiento de sus datos personales.
          </p>

          <h3 className="text-lg font-bold text-blue-900 mt-8">1. Responsable del Tratamiento</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Identidad:</strong> Entidad de Gestión y Modernización (EGM) Atalayas.</li>
            <li><strong>Domicilio:</strong> Alicante, Comunidad Valenciana, España.</li>
            <li><strong>Correo electrónico:</strong> legal@atalayas.com</li>
          </ul>

          <h3 className="text-lg font-bold text-blue-900 mt-8">2. Finalidad del Tratamiento</h3>
          <p>Los datos personales proporcionados serán tratados con las siguientes finalidades:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Gestionar el alta y registro de su empresa en la plataforma Atalayas EGM.</li>
            <li>Facilitar la gestión de incidencias, solicitudes y servicios asociados al parque empresarial.</li>
            <li>Enviar comunicaciones administrativas operativas, alertas del parque y notificaciones relevantes.</li>
          </ul>

          <h3 className="text-lg font-bold text-blue-900 mt-8">3. Legitimación</h3>
          <p>La base legal para el tratamiento de sus datos es:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Ejecución de un contrato:</strong> Para el cumplimiento de la relación y servicios que ofrece la EGM.</li>
            <li><strong>Consentimiento expreso:</strong> Al marcar la casilla "He leído y acepto la Política de Privacidad".</li>
            <li><strong>Interés Legítimo:</strong> Para fines de seguridad de la red y prevención del fraude.</li>
          </ul>

          <h3 className="text-lg font-bold text-blue-900 mt-8">4. Conservación de los Datos</h3>
          <p>
            Sus datos personales se conservarán mientras se mantenga la relación activa con EGM Atalayas. Una vez finalizada la relación, los datos se conservarán, debidamente bloqueados, durante el tiempo necesario para cumplir con las obligaciones legales aplicables.
          </p>

          <h3 className="text-lg font-bold text-blue-900 mt-8">5. Destinatarios</h3>
          <p>
            No se cederán datos a terceros ajenos a la organización, salvo obligación legal, o en caso de que sea estrictamente necesario para la prestación del servicio (proveedores de alojamiento web o servicios en la nube).
          </p>

          <h3 className="text-lg font-bold text-blue-900 mt-8">6. Ejercicio de sus Derechos (ARCO)</h3>
          <p>Usted puede ejercer los siguientes derechos en cualquier momento:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Acceso:</strong> Conocer qué datos estamos tratando.</li>
            <li><strong>Rectificación:</strong> Solicitar la corrección de datos inexactos.</li>
            <li><strong>Supresión / Olvido:</strong> Solicitar que eliminemos sus datos cuando ya no sean necesarios.</li>
            <li><strong>Oposición:</strong> Oponerse al tratamiento de sus datos.</li>
            <li><strong>Limitación y Portabilidad:</strong> Limitar el uso de sus datos y solicitar una copia electrónica.</li>
          </ul>
          <p className="mt-4">
            Para ejercer estos derechos, puede enviar un correo electrónico a nuestra dirección de contacto. Si considera que sus derechos no han sido debidamente atendidos, tiene derecho a presentar una reclamación ante la Agencia Española de Protección de Datos (AEPD).
          </p>
        </div>
      </div>
    </div>
  );
}