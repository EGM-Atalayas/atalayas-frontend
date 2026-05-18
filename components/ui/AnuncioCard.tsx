import React from 'react';
import { Megaphone, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { Noticia } from '@/lib/types/noticias';

interface AnuncioCardProps {
    n: Noticia;
    esBorrador?: boolean;
    publicandoId: string | null;
    GRAD_ANN: string;
    CATEGORIA_COLORS_LIGHT: Record<string, { bg: string; text: string }>;
    esNuevo: (fecha: string) => boolean;
    onActions: {
        abrirEditar: (noticia: Noticia) => void;
        publicarBorrador: (noticia: Noticia) => void;
        eliminarBorrador: (id: string) => void;
        desactivarAnuncio: (id: string) => void;
    };
}

// Comparador personalizado para evitar re-renders innecesarios
const areEqual = (prevProps: AnuncioCardProps, nextProps: AnuncioCardProps): boolean => {
    return (
        prevProps.n.anuncioId === nextProps.n.anuncioId &&
        prevProps.esBorrador === nextProps.esBorrador &&
        prevProps.publicandoId === nextProps.publicandoId &&
        prevProps.GRAD_ANN === nextProps.GRAD_ANN &&
        prevProps.esNuevo === nextProps.esNuevo &&           // si es estable (useCallback)
        // Comparación profunda de CATEGORIA_COLORS_LIGHT (si no cambia, puedes omitir)
        JSON.stringify(prevProps.CATEGORIA_COLORS_LIGHT) === JSON.stringify(nextProps.CATEGORIA_COLORS_LIGHT) &&
        prevProps.onActions === nextProps.onActions          // solo si usas useCallback en las funciones
    );
};

export const AnuncioCard = React.memo<AnuncioCardProps>(({
    n,
    esBorrador = false,
    publicandoId,
    GRAD_ANN,
    CATEGORIA_COLORS_LIGHT,
    esNuevo,
    onActions,
}) => {
    const { abrirEditar, publicarBorrador, eliminarBorrador, desactivarAnuncio } = onActions;

    return (
        <div
            className="flex flex-col rounded-2xl overflow-hidden cursor-pointer"
            style={{
                background: "var(--blanco)",
                border: "1px solid var(--gris-borde)",
                borderTop: esBorrador ? "3px solid #d97706" : "1px solid var(--gris-borde)",
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                transition: "box-shadow 0.2s, transform 0.2s"
            }}
            onClick={() => abrirEditar(n)}
            onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.10)";
                e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)";
                e.currentTarget.style.transform = "translateY(0)";
            }}
        >
            {/* Cabecera */}
            <div
                className="relative w-full overflow-hidden"
                style={{ aspectRatio: "16/6", background: esBorrador ? "linear-gradient(135deg, #92400e, #d97706)" : GRAD_ANN }}
            >
                <Megaphone size={32} strokeWidth={1} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ color: "white", opacity: 0.15 }} />

                {n.imagenUrl && (
                    <img src={n.imagenUrl} alt={n.titulo} className="absolute inset-0 w-full h-full object-cover" />
                )}

                <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.22) 0%, transparent 45%)" }} />

                {/* Badge */}
                <div className="absolute top-2 right-2">
                    {esBorrador ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(253,230,138,0.96)", color: "#78350f" }}>
                            Borrador
                        </span>
                    ) : esNuevo(n.creadoEn) ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "var(--exito)", color: "#fff" }}>Nuevo</span>
                    ) : n.fijado ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#FEF9C3", color: "#854D0E" }}>★ Fijado</span>
                    ) : null}
                </div>
            </div>

            {/* Contenido - igual que antes */}
            <div className="flex flex-col flex-1 px-3 pt-2.5 pb-3 gap-2">
                {/* ... resto del contenido igual ... */}

                <div className="flex items-center gap-1.5 mt-auto pt-2" onClick={(e) => e.stopPropagation()}>
                    {/* Botones con stopPropagation */}
                    <Button
                        variant="primary"
                        size="sm"
                        className="flex-1 justify-center"
                        style={{ background: "var(--azul-egm)", color: "#fff" }}
                        onClick={(e) => { e.stopPropagation(); abrirEditar(n); }}
                    >
                        Editar
                    </Button>

                    {esBorrador ? (
                        <>
                            <Button
                                variant="primary"
                                size="sm"
                                className="flex-1 justify-center"
                                style={{ background: "#16a34a" }}
                                disabled={publicandoId === n.anuncioId}
                                onClick={(e) => { e.stopPropagation(); publicarBorrador(n); }}
                            >
                                {publicandoId === n.anuncioId ? "..." : "Publicar"}
                            </Button>

                            <button
                                onClick={(e) => { e.stopPropagation(); eliminarBorrador(n.anuncioId); }}
                            // ... tus estilos hover
                            >
                                <Trash2 size={13} strokeWidth={2.2} />
                            </button>
                        </>
                    ) : (
                        <Button
                            variant="danger"
                            size="sm"
                            className="flex-1 justify-center"
                            onClick={(e) => { e.stopPropagation(); desactivarAnuncio(n.anuncioId); }}
                        >
                            Desactivar
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}, areEqual);