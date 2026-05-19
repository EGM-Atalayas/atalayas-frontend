import { pipeline, RawImage } from '@xenova/transformers';

let remover: any = null;

export async function removeBackground(file: File): Promise<Blob> {
    if (!remover) {
        remover = await pipeline('image-segmentation', 'briaai/RMBG-1.4', {
            quantized: true,
        });
    }

    const image = await RawImage.fromURL(URL.createObjectURL(file));
    const output = await remover(image);
    const mask = output[0].mask;

    const canvas = document.createElement('canvas');
    canvas.width = mask.width;
    canvas.height = mask.height;
    const ctx = canvas.getContext('2d', { alpha: true })!;

    const imgBitmap = await createImageBitmap(file);
    ctx.drawImage(imgBitmap, 0, 0, mask.width, mask.height);

    ctx.globalCompositeOperation = 'destination-in';
    const maskCanvas = await mask.toCanvas();
    ctx.drawImage(maskCanvas, 0, 0);

    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Error creando blob"));
        }, 'image/png', 1);
    });
}