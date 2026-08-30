import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó archivo" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Definir la ruta de destino dentro de public/dashboard/img
    const uploadDir = path.join(process.cwd(), "public", "dashboard", "img");
    
    // Crear la carpeta si no existe
    await mkdir(uploadDir, { recursive: true });

    // Generar un nombre único para la imagen
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
    const filePath = path.join(uploadDir, fileName);

    await writeFile(filePath, buffer);

    // Retornar la URL pública accesible desde la web
    const publicUrl = `/dashboard/img/${fileName}`;
    return NextResponse.json({ url: publicUrl });
  } catch (error: any) {
    console.error("Error al guardar la imagen:", error);
    return NextResponse.json({ error: "Error al subir la imagen" }, { status: 500 });
  }
}