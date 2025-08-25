import multer from "multer";
import path from "path";
import { destinationForStudentDocument } from "../services/uploadService";

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const studentId = Number(req.params.id);
    const kind = String(req.params.kind || "misc");
    const dir = destinationForStudentDocument(studentId, kind);
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
    const name = `${timestamp}_${safeName}`;
    cb(null, name);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      "application/pdf", 
      "image/png", 
      "image/jpeg", 
      "image/jpg"
    ];
    const isValid = allowedTypes.includes(file.mimetype);
    cb(isValid ? null : new Error("Tipo de arquivo inválido"), isValid);
  },
});