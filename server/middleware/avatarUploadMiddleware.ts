import multer from "multer";
import { destinationForStudentDocument } from "../services/uploadService";

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const studentId = Number(req.params.id);
    cb(null, destinationForStudentDocument(studentId, "avatar"));
  },
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
    cb(null, `${timestamp}_${safeName}`);
  },
});

export const avatarUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowedTypes.includes(file.mimetype)) {
      cb(new Error("A foto deve estar no formato JPEG, PNG ou WebP."));
      return;
    }
    cb(null, true);
  },
});