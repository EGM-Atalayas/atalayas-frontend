import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: "No se recibió archivo" }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Crear nombre único
        const timestamp = Date.now();
        const filename = `logo-${timestamp}-${file.name.replace(/\s+/g, '-')}`;

        // Guardar en carpeta public/uploads (para que sea accesible en /uploads/...)
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        const filePath = path.join(uploadDir, filename);

        // Crear carpeta si no existe
        const fs = await import('fs/promises');
        await fs.mkdir(uploadDir, { recursive: true });

        await writeFile(filePath, buffer);

        const publicUrl = `/uploads/${filename}`;

        console.log("✅ Imagen guardada:", publicUrl);

        return NextResponse.json({
            success: true,
            url: publicUrl,
            filename: filename
        });

    } catch (error: any) {
        console.error("Error en upload:", error);
        return NextResponse.json({
            error: "Error al guardar la imagen",
            details: error.message
        }, { status: 500 });
    }
}