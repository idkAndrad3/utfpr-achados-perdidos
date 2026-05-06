import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

const ALLOWED_MIME = ["image/jpeg", "image/png"];
const MAX_SIZE = 5 * 1024 * 1024;

export class UploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadError";
  }
}

export async function saveUploadedImage(file: File): Promise<string> {
  if (!file || file.size === 0) {
    throw new UploadError("Arquivo de imagem é obrigatório.");
  }
  if (!ALLOWED_MIME.includes(file.type)) {
    throw new UploadError("Apenas imagens JPG ou PNG são permitidas.");
  }
  if (file.size > MAX_SIZE) {
    throw new UploadError("A imagem excede o tamanho máximo de 5 MB.");
  }

  const uploadDir = process.env.UPLOAD_DIR || "public/uploads";
  const absoluteDir = path.join(process.cwd(), uploadDir);
  await mkdir(absoluteDir, { recursive: true });

  const ext = file.type === "image/png" ? "png" : "jpg";
  const filename = `${crypto.randomUUID()}.${ext}`;
  const filepath = path.join(absoluteDir, filename);

  const arrayBuffer = await file.arrayBuffer();
  await writeFile(filepath, Buffer.from(arrayBuffer));

  return `/uploads/${filename}`;
}
