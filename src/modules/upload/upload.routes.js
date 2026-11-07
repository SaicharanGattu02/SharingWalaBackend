import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { ApiResponse } from '../../utils/apiResponse.js';
import { ApiError } from '../../utils/apiError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'photos';
    if (file.mimetype.startsWith('video/') || /\.(mp4|mov|mkv|webm|avi|3gp|m4v)$/i.test(file.originalname)) {
      folder = 'videos';
    }
    const uploadPath = path.join(process.cwd(), 'public', 'uploads', folder);
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || (file.mimetype.startsWith('video/') ? '.mp4' : '.jpg');
    const uniqueSuffix = `${Date.now()}_${Math.round(Math.random() * 1e9)}`;
    cb(null, `${file.fieldname}_${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB max for video reels
  },
});

const router = Router();

const handleUpload = asyncHandler(async (req, res) => {
  const file = req.file || (req.files && req.files[0]);
  if (!file) {
    throw new ApiError(400, 'No file uploaded. Please provide a video or photo file.');
  }

  const isVideo = file.mimetype.startsWith('video/') || /\.(mp4|mov|mkv|webm|avi|3gp|m4v)$/i.test(file.filename);
  const folder = isVideo ? 'videos' : 'photos';
  const relativePath = `/uploads/${folder}/${file.filename}`;

  const host = req.get('host') || '172.20.10.2:5000';
  const isDomain = !host.includes('localhost') && !host.includes('127.0.0.1') && !host.startsWith('192.168.') && !host.startsWith('10.') && !host.startsWith('172.');
  const protocol = isDomain || req.get('x-forwarded-proto') === 'https' ? 'https' : (req.protocol || 'http');
  const fullUrl = `${protocol}://${host}${relativePath}`;

  res.status(200).json(
    new ApiResponse(
      200,
      {
        url: fullUrl,
        videoUrl: fullUrl,
        thumbnailUrl: fullUrl,
        relativeUrl: relativePath,
        filename: file.filename,
        mimetype: file.mimetype,
        size: file.size,
      },
      'File uploaded successfully'
    )
  );
});

router.post('/', upload.any(), handleUpload);
router.post('/video', upload.any(), handleUpload);
router.post('/image', upload.any(), handleUpload);

export default router;

