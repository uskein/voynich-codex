import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();
router.use(authenticate);

const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = crypto.randomUUID() + ext;
    cb(null, name);
  }
});

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
}).single('file');

router.post('/upload', (req: Request, res: Response) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      const msg = err.code === 'LIMIT_FILE_SIZE' ? 'Archivo demasiado grande (max 5MB)' : err.message;
      res.status(400).json({ error: msg });
      return;
    }
    if (err) {
      res.status(400).json({ error: err.message || 'Error al subir archivo' });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: 'No se envio ningun archivo' });
      return;
    }

    const url = `/uploads/${req.file.filename}`;
    res.json({ url, filename: req.file.filename, size: req.file.size });
  });
});

const uploadMultiple = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
}).array('files', 10);

router.post('/upload/multiple', (req: Request, res: Response) => {
  uploadMultiple(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      const msg = err.code === 'LIMIT_FILE_SIZE' ? 'Archivo demasiado grande (max 5MB)' : err.message;
      res.status(400).json({ error: msg });
      return;
    }
    if (err) {
      res.status(400).json({ error: err.message || 'Error al subir archivos' });
      return;
    }
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ error: 'No se enviaron archivos' });
      return;
    }

    const urls = files.map(f => ({
      url: `/uploads/${f.filename}`,
      filename: f.filename,
      size: f.size
    }));

    res.json({ files: urls });
  });
});

export default router;
