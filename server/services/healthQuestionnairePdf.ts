import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import type { HealthAnswer } from "../utils/healthRisk";

export async function generateHealthPdf(
  studentFullName: string,
  answers: HealthAnswer[],
  submittedAt: Date,
  outDir: string,
  studentId: number,
  schoolName: string = "Academia de Jiu-Jitsu"
): Promise<{ filePath: string; size: number; fileName: string }> {
  // Garante que o diretório existe
  fs.mkdirSync(outDir, { recursive: true });

  const fileName = `questionario-saude_${studentId}_${submittedAt.getTime()}.pdf`;
  const filePath = path.join(outDir, fileName);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Cabeçalho
    doc.fontSize(20).text(schoolName, { align: "center" });
    doc.moveDown(0.3);
    doc.fontSize(16).text("Questionário de Saúde - PAR-Q+", { align: "center" });
    doc.moveDown(1);

    // Informações do aluno
    doc.fontSize(12);
    doc.text(`Aluno: ${studentFullName}`, { continued: false });
    doc.text(`Data/Hora de preenchimento: ${submittedAt.toLocaleString("pt-BR")}`);
    doc.moveDown(1);

    // Instruções
    doc.fontSize(10);
    doc.text(
      "Este questionário foi preenchido pelo aluno como parte do processo de matrícula. " +
      "As respostas fornecidas são de responsabilidade do aluno e servem para identificar " +
      "possíveis restrições médicas para a prática de atividades físicas.",
      { align: "justify" }
    );
    doc.moveDown(1);

    // Perguntas e respostas
    doc.fontSize(11);
    answers.forEach((answer, i) => {
      // Quebra de página se necessário
      if (doc.y > 700) {
        doc.addPage();
      }

      doc.font("Helvetica-Bold").text(`${i + 1}. ${answer.question}`);
      
      let responseText = "";
      if (answer.value === "yes") {
        responseText = "✓ SIM";
      } else if (answer.value === "no") {
        responseText = "✓ NÃO";
      } else {
        responseText = answer.value || "-";
      }

      doc.font("Helvetica").text(`Resposta: ${responseText}`);
      doc.moveDown(0.8);
    });

    // Rodapé com declaração
    doc.addPage();
    doc.fontSize(12);
    doc.font("Helvetica-Bold").text("DECLARAÇÃO", { align: "center" });
    doc.moveDown(0.5);
    
    doc.font("Helvetica").fontSize(10).text(
      `Eu, ${studentFullName}, declaro que as informações fornecidas neste questionário ` +
      "são verdadeiras e completas. Estou ciente de que a omissão ou falsidade de informações " +
      "pode comprometer minha segurança durante a prática de atividades físicas.",
      { align: "justify" }
    );
    
    doc.moveDown(2);
    doc.text(`Data: ${submittedAt.toLocaleDateString("pt-BR")}`);
    doc.moveDown(1);
    doc.text("_".repeat(50));
    doc.text(`${studentFullName}`, { align: "center" });
    doc.text("Assinatura do Aluno", { align: "center" });

    // Finaliza o documento
    doc.end();

    stream.on("finish", () => {
      const stats = fs.statSync(filePath);
      resolve({ filePath, size: stats.size, fileName });
    });

    stream.on("error", reject);
  });
}