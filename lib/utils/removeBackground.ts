'use client';

export async function removeBackground(file: File): Promise<Blob> {
    try {
        const { removeBackground } = await import('@imgly/background-removal');

        console.log("Quitando fondo con @imgly...");

        const result = await removeBackground(file, {
            model: 'isnet',           // mejor calidad para logos
            output: {
                format: 'image/png',
                quality: 0.95,
            },
        });

        return result;
    } catch (error) {
        console.error("Error quitando fondo:", error);
        throw error;
    }
}