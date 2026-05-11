const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const PUBLIC_DIR = path.join(__dirname, "../public");

const PHOTOS = [
  "trabajo-bici.jpg",
  "comunicacion-trabajo.jpg",
  "background-comunicacion-empleado.jpg",
  "background-login.jpg",
  "negociacion-habilidades.jpg",
  "atalayas-circular.jpg",
  "background-formacion-empleado.jpg",
  "coche-compartido.jpg",
  "diversidad.jpg",
  "metodologias-agiles.jpg",
  "herramientas-digitales.jpg",
  "comunidad.jpg",
  "ciberseguridad-datos.jpg",
  "background-dashboard.jpg",
  "background-login2.jpeg",
  "background-empresa.jpg",
  "background-invitado.jpg",
  "background-comunidad.jpg",
  "empresas-hoy.jpg",
  "bg-colaboraciones.jpg",
  "bg-innova.jpg",
  "bg-instituto.jpg",
  "autobus.jpg",
  "aitex-icono.jpg",
  "umh-icono.jpg",
  "cenid-icono.jpg",
  "iti-icono.jpg",
];

const LOGOS_PNG = [
  "aparcamiento-vao.png",
  "logo-gofre.png",
  "logo-aliaxis.png",
  "logo-famosa.png",
  "logo-pompadour.png",
  "logo-sprinter.png",
  "logo-blinker.png",
  "logo-seur.png",
  "logo-itae.png",
  "ua-icono.png",
  "logo.webp",
  "ddcv-icono.png",
  "empresas-solidarias.png",
  "logo-chatbot.png",
  "aiju-icono.png",
  "logo-en-femenino.png",
  "pca-icono.png",
  "inescop-icono.png",
  "pcumh-icono.png",
  "af-icono.png",
  "ceei-icono.png",
  "background-comunidad.png",
];

const SVG_FILES = ["vercel.svg", "window.svg", "globe.svg", "logo.svg", "next.svg", "file.svg"];

async function optimizePhoto(filename) {
  const inputPath = path.join(PUBLIC_DIR, filename);
  const isJpeg = filename.endsWith(".jpeg");
  const baseName = filename.replace(/\.(jpg|jpeg)$/i, "");
  const outputPath = path.join(PUBLIC_DIR, `${baseName}.webp`);

  if (!fs.existsSync(inputPath)) {
    console.log(`  ⏭  No existe: ${filename}`);
    return;
  }

  try {
    await sharp(inputPath)
      .resize(1920, 1080, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 75, effort: 6 })
      .toFile(outputPath);

    const origSize = fs.statSync(inputPath).size;
    const newSize = fs.statSync(outputPath).size;
    const reduction = ((1 - newSize / origSize) * 100).toFixed(1);

    console.log(`  ✅ ${filename} → ${baseName}.webp (${(origSize / 1024).toFixed(0)}KB → ${(newSize / 1024).toFixed(0)}KB, -${reduction}%)`);

    fs.unlinkSync(inputPath);
    console.log(`  🗑  Eliminado: ${filename}`);
  } catch (err) {
    console.error(`  ❌ Error con ${filename}:`, err.message);
  }
}

async function optimizeLogo(filename) {
  const inputPath = path.join(PUBLIC_DIR, filename);

  if (!fs.existsSync(inputPath)) {
    console.log(`  ⏭  No existe: ${filename}`);
    return;
  }

  const isWebp = filename.endsWith(".webp");
  const isPng = filename.endsWith(".png");
  const baseName = filename.replace(/\.(png|webp)$/i, "");

  if (isWebp) {
    try {
      const origSize = fs.statSync(inputPath).size;
      await sharp(inputPath)
        .webp({ quality: 80, effort: 6 })
        .toFile(inputPath + ".tmp");

      const newSize = fs.statSync(inputPath + ".tmp").size;
      fs.renameSync(inputPath + ".tmp", inputPath);

      const reduction = ((1 - newSize / origSize) * 100).toFixed(1);
      console.log(`  ✅ ${filename} optimizado (${(origSize / 1024).toFixed(0)}KB → ${(newSize / 1024).toFixed(0)}KB, -${reduction}%)`);
    } catch (err) {
      console.error(`  ❌ Error con ${filename}:`, err.message);
    }
    return;
  }

  if (isPng) {
    const outputPath = path.join(PUBLIC_DIR, `${baseName}.webp`);
    try {
      const origSize = fs.statSync(inputPath).size;
      await sharp(inputPath)
        .webp({ quality: 80, effort: 6 })
        .toFile(outputPath);

      const newSize = fs.statSync(outputPath).size;
      const reduction = ((1 - newSize / origSize) * 100).toFixed(1);
      console.log(`  ✅ ${filename} → ${baseName}.webp (${(origSize / 1024).toFixed(0)}KB → ${(newSize / 1024).toFixed(0)}KB, -${reduction}%)`);

      fs.unlinkSync(inputPath);
      console.log(`  🗑  Eliminado: ${filename}`);
    } catch (err) {
      console.error(`  ❌ Error con ${filename}:`, err.message);
    }
  }
}

async function main() {
  console.log("🖼  Optimizando imágenes...\n");

  console.log("📸 Fotos y backgrounds:");
  for (const file of PHOTOS) {
    await optimizePhoto(file);
  }

  console.log("\n🎨 Logos e iconos:");
  for (const file of LOGOS_PNG) {
    await optimizeLogo(file);
  }

  console.log("\n✅ Optimización completada.");
  console.log("\n⚠️  Recuerda actualizar las referencias en el código:");
  console.log("   - .jpg → .webp");
  console.log("   - .jpeg → .webp");
  console.log("   - .png → .webp (logos)");
}

main();
