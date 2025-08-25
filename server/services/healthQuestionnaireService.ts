import path from "path";
import { storage } from "../storage";
import { isRisky, HealthAnswer } from "../utils/healthRisk";
import { generateHealthPdf } from "./healthQuestionnairePdf";
import fs from "fs";

const STORAGE_ROOT = process.env.STORAGE_ROOT || path.join(process.cwd(), "storage");

export async function saveHealthQuestionnaire(
  studentId: number, 
  answers: HealthAnswer[],
  agreedToTerms: boolean = false,
  ipAddress?: string
) {
  const risky = isRisky(answers);
  const submittedAt = new Date();

  // Busca informações do aluno e usuário via storage
  const student = await storage.getStudent(studentId);
  if (!student) {
    throw new Error("Aluno não encontrado");
  }

  const user = await storage.getUser(student.userId);
  if (!user) {
    throw new Error("Dados do usuário não encontrados");
  }

  const fullName = `${user.firstName} ${user.lastName}`.trim();

  // Gera o PDF do questionário
  const outDir = path.join(STORAGE_ROOT, "students", String(studentId), "health");
  const { filePath, size, fileName } = await generateHealthPdf(
    fullName,
    answers,
    submittedAt,
    outDir,
    studentId
  );

  // Dados para salvar no questionário
  const questionnaireData = {
    studentId,
    answersJson: JSON.stringify(answers),
    submittedAt,
    risky,
    pdfPath: filePath,
    pdfSize: size,
    agreedToTerms,
    agreedAt: agreedToTerms ? submittedAt : null,
    ipAddress: ipAddress || null,
  };

  // Dados para salvar documento
  const documentData = {
    studentId,
    type: "health_form" as const,
    name: fileName,
    filename: fileName,
    mime: "application/pdf",
    size,
    path: filePath,
    description: "Questionário de Saúde (PAR-Q+) - PDF Gerado Automaticamente",
  };

  // Salva/atualiza student com questionnaire status
  await storage.updateStudent(studentId, {
    requiresMedicalCertificate: risky,
    medicalCertificateStatus: risky ? "PENDING" : "WAIVED",
    healthQuestionnaireCompletedAt: submittedAt,
    agreedToHealthTerms: agreedToTerms,
    healthTermsAgreedAt: agreedToTerms ? submittedAt : null,
  });

  return { 
    risky, 
    submittedAt, 
    fileName, 
    size,
    requiresMedicalCertificate: risky,
    agreedToTerms,
    questionnaireData,
    documentData
  };
}

export async function getHealthQuestionnaire(studentId: number) {
  // Por enquanto, vamos retornar null e implementar quando o storage tiver métodos específicos
  return null;
}