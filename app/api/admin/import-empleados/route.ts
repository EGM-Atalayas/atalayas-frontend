import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file     = formData.get("file") as File | null;

    if (!file) return NextResponse.json({ error: "No se recibió archivo" }, { status: 400 });

    const buffer   = Buffer.from(await file.arrayBuffer());
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const worksheet = workbook.worksheets[0];
    const filas: { rowNum: number; values: string[] }[] = [];

    worksheet.eachRow((row, rowIdx) => {
      if (rowIdx === 1) return; // saltar cabecera
      const values = (row.values as unknown[]).slice(1).map((v) => String(v ?? "").trim());
      if (values.some((v) => v)) filas.push({ rowNum: rowIdx, values });
    });

    return NextResponse.json({ filas });
  } catch (err) {
    console.error("Error importando Excel:", err);
    return NextResponse.json({ error: "El archivo no es un Excel válido" }, { status: 400 });
  }
}
