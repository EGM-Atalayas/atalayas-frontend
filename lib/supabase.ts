import { createClient } from "@supabase/supabase-js";

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnon);

/**
 * Sube una imagen al bucket "modulos" de Supabase Storage
 * y devuelve la URL pública.
 */
export async function subirImagenModulo(file: File): Promise<string> {
  const ext      = file.name.split(".").pop() ?? "jpg";
  const nombre   = `${crypto.randomUUID()}.${ext}`;
  const ruta     = `portadas/${nombre}`;

  const { error } = await supabase.storage
    .from("modulos")
    .upload(ruta, file, { contentType: file.type, upsert: false });

  if (error) throw new Error(`Error al subir imagen: ${error.message}`);

  const { data } = supabase.storage.from("modulos").getPublicUrl(ruta);
  return data.publicUrl;
}
