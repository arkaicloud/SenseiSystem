import path from "path";
import fs from "fs";
import { and, desc, eq } from "drizzle-orm";
import { db } from "../db";
import { studentDocuments } from "@shared/schema";

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
  const [document] = await db
    .insert(studentDocuments)
    .values({
      studentId,
      type: documentType as "health_form" | "graduation_certificate" | "medical_certificate" | "identification" | "contract" | "other",
      name: file.originalname,
      filename: file.filename,
      mime: file.mimetype,
      size: file.size,
      path: file.path,
      description: description || `Upload de ${documentType}`,
    })
    .returning();

  return document;
}

export async function getStudentDocuments(studentId: number) {
  return db
    .select()
    .from(studentDocuments)
    .where(eq(studentDocuments.studentId, studentId))
    .orderBy(desc(studentDocuments.uploadedAt));
}

export async function getDocumentById(documentId: number) {
  const [document] = await db
    .select()
    .from(studentDocuments)
    .where(eq(studentDocuments.id, documentId))
    .limit(1);
  return document || null;
}

export async function deleteDocument(documentId: number, studentId: number) {
  const [document] = await db
    .select({ path: studentDocuments.path })
    .from(studentDocuments)
    .where(and(
      eq(studentDocuments.id, documentId),
      eq(studentDocuments.studentId, studentId),
    ))
    .limit(1);

  if (!document) return false;

  await db
    .delete(studentDocuments)
    .where(and(
      eq(studentDocuments.id, documentId),
      eq(studentDocuments.studentId, studentId),
    ));
  fs.rmSync(document.path, { force: true });
  return true;
}