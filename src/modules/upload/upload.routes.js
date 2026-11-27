import { Router } from 'express';
import crypto from 'crypto';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { ApiResponse } from '../../utils/apiResponse.js';
import { ApiError } from '../../utils/apiError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const ALLOWED_IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic', '.heif']);
const ALLOWED_VIDEO_EXTS = new Set(['.mp4', '.mov', '.mkv', '.webm', '.avi', '.3gp', '.m4v']);

const isVideoFile = (file) => {
  const ext = path.extname(file.originalname || '').toLowerCase();
  return file.mimetype.startsWith('video/') || ALLOWED_VIDEO_EXTS.has(ext);
};

const isImageFile = (file) => {
  const ext = path.extname(file.originalname || '').toLowerCase();
  return (
    (file.mimetype.startsWith('image/') && file.mimetype !== 'image/svg+xml') ||
    ALLOWED_IMAGE_EXTS.has(ext)
  );
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = isVideoFile(file) ? 'videos' : 'photos';
    const uploadPath = path.join(process.cwd(), 'public', 'uploads', folder);
    fs.mkdir(uploadPath, { recursive: true }, (err) => cb(err, uploadPath));
  },
  filename: (req, file, cb) => {
    const rawExt = path.extname(file.originalname || '').toLowerCase();
    const isVid = isVideoFile(file);
    const allowedSet = isVid ? ALLOWED_VIDEO_EXTS : ALLOWED_IMAGE_EXTS;
    const ext = allowedSet.has(rawExt) ? rawExt : (isVid ? '.mp4' : '.jpg');
    const safeField = String(file.fieldname || 'file').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 24) || 'file';
    cb(null, `${safeField}_${Date.now()}_${crypto.randomUUID().slice(0, 8)}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (isImageFile(file) || isVideoFile(file)) {
    return cb(null, true);
  }
  return cb(new ApiError(400, 'Unsupported file type. Only standard image and video formats are allowed.'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB max for video reels
  },
});

const router = Router();
router.use(authenticate);

const handleUpload = asyncHandler(async (req, res) => {
  const file = req.file || (req.files && req.files[0]);
  if (!file) {
    throw new ApiError(400, 'No file uploaded. Please provide a video or photo file.');
  }

  const isVideo = isVideoFile(file);
  const folder = isVideo ? 'videos' : 'photos';
  const relativePath = `/uploads/${folder}/${file.filename}`;

  const host = req.get('host') || 'localhost:5000';
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
