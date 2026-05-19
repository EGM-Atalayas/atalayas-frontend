"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface Props {
  abierto: boolean;
  nombreEmpleado: string;
  cargando?: boolean;
  onConfirmar: (nuevaPassword: string) => void;
  onCancelar: () => void;
}

export function ModalResetPassword({
  abierto,
  nombreEmpleado,
  cargando = false,
  onConfirmar,
  onCancelar,
}: Props) {
  const [password, setPassword] = useState("");
  const [verPass, setVerPass] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirmar = () => {
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    setError(null);
    onConfirmar(password);
  };

  const handleCancelar = () => {
    setPassword("");
    setError(null);
    setVerPass(false);
    onCancelar();
  };

  return (
    <AnimatePresence>
      {abierto && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ zIndex: 1200, background: "rgba(0,0,0,0.45)" }}
          onClick={handleCancelar}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="rounded-2xl p-6 flex flex-col gap-4 w-full max-w-sm"
            style={{ background: "var(--blanco)", boxShadow: "0 24px 56px rgba(0,0,0,0.22)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Icono + título */}
            <div className="flex flex-col items-center text-center gap-3">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ background: "rgba(38,82,158,0.10)" }}
              >
                <KeyRound size={26} style={{ color: "var(--azul-egm)" }} />
              </div>
              <div>
                <p className="font-bold text-lg" style={{ color: "var(--texto-primario)", letterSpacing: "-0.02em" }}>
                  Resetear contraseña
                </p>
                <p className="text-sm mt-1" style={{ color: "var(--texto-muted)" }}>
                  Nueva contraseña para <span className="font-semibold" style={{ color: "var(--texto-primario)" }}>{nombreEmpleado}</span>
                </p>
              </div>
            </div>

            {/* Campo contraseña */}
            <div className="flex flex-col gap-1.5">
              <div className="relative">
                <input
                  type={verPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  onKeyDown={(e) => { if (e.key === "Enter") handleConfirmar(); }}
                  placeholder="Mínimo 8 caracteres"
                  autoFocus
                  className="w-full pr-10 pl-3 py-2.5 text-sm rounded-xl outline-none"
                  style={{
                    background: "var(--gris-superficie, #f3f4f6)",
                    border: `1.5px solid ${error ? "var(--error)" : "var(--gris-borde)"}`,
                    color: "var(--texto-primario)",
                    transition: "border-color 0.15s",
                  }}
                  onFocus={(e) => { if (!error) e.currentTarget.style.borderColor = "var(--azul-egm)"; }}
                  onBlur={(e) => { if (!error) e.currentTarget.style.borderColor = "var(--gris-borde)"; }}
                />
                <button
                  type="button"
                  onClick={() => setVerPass((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--texto-muted)", background: "none", border: "none", cursor: "pointer", padding: 2 }}
                  tabIndex={-1}
                >
                  {verPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {error && (
                <p className="text-xs" style={{ color: "var(--error)" }}>{error}</p>
              )}
            </div>

            {/* Botones */}
            <div className="flex flex-col gap-2">
              <Button
                variant="primary"
                size="md"
                className="w-full justify-center"
                onClick={handleConfirmar}
                disabled={cargando || password.length === 0}
              >
                {cargando ? "Guardando…" : "Guardar contraseña"}
              </Button>
              <Button
                variant="secondary"
                size="md"
                className="w-full justify-center"
                onClick={handleCancelar}
                disabled={cargando}
              >
                Cancelar
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
