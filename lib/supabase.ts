import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Inicialización lazy — no explota al importar si las variables no están definidas
let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (_client) return _client;
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error("Supabase no configurado: faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  _client = createClient(url, anon);
  return _client;
}

/**
 * Sube una imagen al bucket "modulos" de Supabase Storage
 * y devuelve la URL pública.
 */
export async function subirImagenModulo(file: File): Promise<string> {
  const client = getClient();
  const ext    = file.name.split(".").pop() ?? "jpg";
  const nombre = `${crypto.randomUUID()}.${ext}`;
  const ruta   = `portadas/${nombre}`;

  const { error } = await client.storage
    .from("modulos")
    .upload(ruta, file, { contentType: file.type, upsert: false });

  if (error) throw new Error(`Error al subir imagen: ${error.message}`);

  const { data } = client.storage.from("modulos").getPublicUrl(ruta);
  return data.publicUrl;
}

/**
 * Sube un documento (PDF u otro) al bucket "modulos" de Supabase Storage
 * y devuelve la URL pública y el nombre original del archivo.
 */
export async function subirAdjunto(file: File): Promise<{ url: string; nombre: string }> {
  const client = getClient();
  const ext    = file.name.split(".").pop() ?? "pdf";
  const nombre = `${crypto.randomUUID()}.${ext}`;
  const ruta   = `adjuntos/${nombre}`;

  const { error } = await client.storage
    .from("modulos")
    .upload(ruta, file, { contentType: file.type, upsert: false });

  if (error) throw new Error(`Error al subir adjunto: ${error.message}`);

  const { data } = client.storage.from("modulos").getPublicUrl(ruta);
  return { url: data.publicUrl, nombre: file.name };
}

/**
 * Sube una imagen de portada de perfil al bucket "modulos" de Supabase Storage
 * y devuelve la URL pública.
 */
export async function subirImagenBanner(file: File): Promise<string> {
  const client = getClient();
  const ext    = file.name.split(".").pop() ?? "jpg";
  const nombre = `${crypto.randomUUID()}.${ext}`;
  const ruta   = `portadas/${nombre}`;

  const { error } = await client.storage
    .from("modulos")
    .upload(ruta, file, { contentType: file.type, upsert: false });

  if (error) throw new Error(`Error al subir banner: ${error.message}`);

  const { data } = client.storage.from("modulos").getPublicUrl(ruta);
  return data.publicUrl;
}

/**
 * Sube un archivo de audio (MP3) al bucket "modulos" de Supabase Storage
 * y devuelve la URL pública.
 */
export async function subirAudioModulo(audioBlob: Blob): Promise<string> {
  const client = getClient();
  const nombre = `${crypto.randomUUID()}.mp3`;
  const ruta   = `audios/${nombre}`;

  const { error } = await client.storage
    .from("modulos")
    .upload(ruta, audioBlob, { contentType: "audio/mpeg", upsert: false });

  if (error) throw new Error(`Error al subir audio: ${error.message}`);

  const { data } = client.storage.from("modulos").getPublicUrl(ruta);
  return data.publicUrl;
}
