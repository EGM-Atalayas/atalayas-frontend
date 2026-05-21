import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";

interface EmpleadoExport {
  nombre:       string;
  apellidos:    string;
  email:        string;
  puesto:       string;
  departamento: string;
  rol:          string;
  estado:       string;
  fechaAlta:    string;
}

export async function POST(req: NextRequest) {
  try {
    const { empleados }: { empleados: EmpleadoExport[] } = await req.json();

    const workbook  = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Empleados");

    worksheet.columns = [
      { header: "Nombre",        key: "nombre",       width: 20 },
      { header: "Apellidos",     key: "apellidos",    width: 25 },
      { header: "Email",         key: "email",        width: 30 },
      { header: "Puesto",        key: "puesto",       width: 25 },
      { header: "Departamento",  key: "departamento", width: 20 },
      { header: "Rol",           key: "rol",          width: 15 },
      { header: "Estado",        key: "estado",       width: 12 },
      { header: "Fecha de alta", key: "fechaAlta",    width: 18 },
    ];

    worksheet.getRow(1).eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1B3F7E" } };
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });

    empleados.forEach((e) => worksheet.addRow(e));

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="empleados_${new Date().toISOString().split("T")[0]}.xlsx"`,
      },
    });
  } catch (err) {
    console.error("Error exportando Excel:", err);
    return NextResponse.json({ error: "Error generando el archivo" }, { status: 500 });
  }
}
