import React from "react";
import Link from "next/link";

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-16 px-6">
      <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-slate-100 text-slate-700">
        <div className="mb-8 border-b border-slate-100 pb-6">
          <Link href="/login" className="text-blue-600 hover:text-blue-800 text-sm font-semibold mb-4 inline-block">
            &larr; Volver
          </Link>
          <h1 className="text-3xl font-bold text-blue-950 mb-2">Términos y Condiciones de Uso</h1>
          <p className="text-sm text-slate-500">Fecha de última actualización: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="space-y-6 text-sm leading-relaxed">
          <p>
            Bienvenido a la plataforma digital de la <strong>Entidad de Gestión y Modernización (EGM) Atalayas</strong>. Al acceder o utilizar nuestro sitio web y plataforma de gestión, usted acepta cumplir y estar sujeto a los siguientes Términos y Condiciones. Si no está de acuerdo con alguna parte de estos términos, no debe utilizar nuestra plataforma.
          </p>

          <h3 className="text-lg font-bold text-blue-900 mt-8">1. Objeto de la Plataforma</h3>
          <p>
            La plataforma Atalayas EGM ha sido diseñada para facilitar la gestión, comunicación y operatividad entre la Entidad y las empresas adheridas al parque empresarial, así como la gestión interna de incidencias, solicitudes y empleados.
          </p>

          <h3 className="text-lg font-bold text-blue-900 mt-8">2. Registro y Cuentas de Usuario</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Empresas:</strong> El registro de empresas debe ser realizado por un representante legal o persona autorizada. Al registrarse, usted garantiza que toda la información proporcionada (incluyendo el CIF y datos de contacto) es precisa, actual y completa.</li>
            <li><strong>Seguridad:</strong> El usuario es responsable de mantener la confidencialidad de su contraseña y de cualquier actividad que ocurra bajo su cuenta. Debe notificar inmediatamente a EGM Atalayas cualquier uso no autorizado de su cuenta.</li>
            <li><strong>Rechazo de solicitudes:</strong> EGM Atalayas se reserva el derecho a validar, aceptar o rechazar solicitudes de alta de empresas si los datos proporcionados no pueden ser verificados o no corresponden al ámbito del parque empresarial.</li>
          </ul>

          <h3 className="text-lg font-bold text-blue-900 mt-8">3. Obligaciones del Usuario</h3>
          <p>Al utilizar nuestra plataforma, usted se compromete a:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>No utilizar la plataforma para fines ilegales o no autorizados.</li>
            <li>No intentar comprometer la seguridad de la plataforma (hackeos, inyección de código, etc.).</li>
            <li>No subir contenido malicioso, virus, ni enviar comunicaciones masivas no deseadas a través de los sistemas internos.</li>
            <li>Mantener actualizados los datos de la empresa y los usuarios asociados a la misma.</li>
          </ul>

          <h3 className="text-lg font-bold text-blue-900 mt-8">4. Propiedad Intelectual</h3>
          <p>
            Todo el contenido presente en la plataforma (textos, gráficos, logotipos, código, diseño) es propiedad de EGM Atalayas o de sus licenciantes y está protegido por las leyes de propiedad intelectual y derechos de autor de España. No se permite la reproducción total o parcial sin autorización previa y por escrito.
          </p>

          <h3 className="text-lg font-bold text-blue-900 mt-8">5. Limitación de Responsabilidad</h3>
          <p>
            EGM Atalayas se esfuerza por mantener la plataforma operativa y libre de errores. No obstante, no garantizamos la disponibilidad ininterrumpida del servicio y no seremos responsables por pérdidas de datos, interrupciones del negocio o daños derivados del uso o incapacidad de uso de la plataforma.
          </p>

          <h3 className="text-lg font-bold text-blue-900 mt-8">6. Legislación y Fuero</h3>
          <p>
            Estos términos se rigen e interpretan de acuerdo con la legislación de España. Para cualquier controversia que pudiera derivarse, ambas partes se someten a la jurisdicción de los tribunales de Alicante.
          </p>
        </div>
      </div>
    </div>
  );
}