"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Trash2, TriangleAlert, UserCheck, UserX } from "lucide-react";
import { Button } from "@/components/ui/Button";

type Variante = "danger" | "warning" | "success";

interface Props {
  abierto: boolean;
  titulo: string;
  descripcion: string;
  textoConfirmar: string;
  variante?: Variante;
  cargando?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}

const CONFIG: Record<Variante, { bg: string; color: string; Icon: React.ElementType }> = {
  danger:  { bg: "var(--error-light)",  color: "var(--error)",   Icon: Trash2 },
  warning: { bg: "#FEF9C3",             color: "#D97706",         Icon: TriangleAlert },
  success: { bg: "#dcfce7",                  color: "#16a34a",            Icon: UserCheck },
};

export function ModalConfirm({
  abierto,
  titulo,
  descripcion,
  textoConfirmar,
  variante = "warning",
  cargando = false,
  onConfirmar,
  onCancelar,
}: Props) {
  const { bg, color, Icon } = CONFIG[variante];

  return (
    <AnimatePresence>
      {abierto && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ zIndex: 1200, background: "rgba(0,0,0,0.45)" }}
          onClick={onCancelar}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="rounded-2xl p-6 flex flex-col items-center text-center gap-4 w-full max-w-xs"
            style={{ background: "var(--blanco)", boxShadow: "0 24px 56px rgba(0,0,0,0.22)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: bg }}
            >
              <Icon size={26} style={{ color }} />
            </div>

            <div>
              <p className="font-bold text-lg" style={{ color: "var(--texto-primario)", letterSpacing: "-0.02em" }}>
                {titulo}
              </p>
              <p className="text-sm mt-1.5" style={{ color: "var(--texto-muted)" }}>
                {descripcion}
              </p>
            </div>

            <div className="flex flex-col gap-2 w-full">
              <Button
                variant="primary"
                size="md"
                className="w-full justify-center"
                onClick={onCancelar}
                disabled={cargando}
              >
                Cancelar
              </Button>
              <Button
                variant={variante === "success" ? "success" : "danger"}
                size="md"
                className="w-full justify-center"
                onClick={onConfirmar}
                disabled={cargando}
              >
                {cargando ? "Procesando..." : textoConfirmar}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
