import path from "path";
import fs from "fs";

const STORAGE_ROOT = process.env.STORAGE_ROOT || path.join(process.cwd(), "storage");

export function ensureDir(dirPath: string) {
  fs.mkdirSync(dirPath, { recursive: true });
}

export function destinationForStudentDocument(studentId: number, documentType: string) {
  const dir = path.join(STORAGE_ROOT, "students", String(studentId), documentType.toLowerCase());
  ensureDir(dir);
  return dir;
}

export async function saveStudentDocument(
  studentId: number,
  file: Express.Multer.File,
  documentType: string,
  description?: string
) {
  // Implementação simplificada - pode ser expandida depois
  return {
    id: Date.now(), // ID temporário
    studentId,
    type: documentType,
    name: file.originalname,
    filename: file.filename,
    mime: file.mimetype,
    size: file.size,
    path: file.path,
    description: description || `Upload de ${documentType}`,
    uploadedAt: new Date(),
  };
}

export async function getStudentDocuments(studentId: number) {
  // Implementação simplificada - retorna array vazio por enquanto
  return [];
}

export async function getDocumentById(documentId: number) {
  // Implementação simplificada - retorna null por enquanto
  return null;
}

export async function deleteDocument(documentId: number, studentId: number) {
  // Implementação simplificada
  return true;
}