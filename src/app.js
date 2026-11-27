import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { env } from './config/env.js';
import routes from './routes/index.js';
import shareLinkRoutes from './modules/share/share.routes.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { ApiError } from './utils/apiError.js';
import { ApiResponse } from './utils/apiResponse.js';

const app = express();

// Trust reverse proxy (Nginx, AWS, Cloudflare) for correct HTTPS detection
app.set('trust proxy', 1);

// Security Middlewares
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginOpenerPolicy: false,
  })
);

// Dynamic CORS configuration:
// When credentials: true is set, browsers forbid Access-Control-Allow-Origin: '*'
// Reflecting the requesting origin satisfies the W3C/Fetch CORS specification for local web dashboards & apps.
const allowedOrigins = env.corsOrigin
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman) or when '*' / development
      if (!origin || !env.isProduction || env.corsOrigin === '*' || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new ApiError(403, 'Origin not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'X-Device-Id',
      'X-Device-Type',
      'X-Device-Name',
      'Device-Id',
      'Device-Type',
    ],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
  })
);

// Logging Middleware
if (env.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// Request Parsers (allow up to 10mb for photo/avatar uploads)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static Assets (uploads, avatars) with nosniff and cache headers
app.use(
  '/uploads',
  express.static(path.join(process.cwd(), 'public', 'uploads'), {
    maxAge: '7d',
    setHeaders: (res) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
    },
  })
);

// Shareable trip links (/r/ride/:id) + Android App Links verification
// (/.well-known/assetlinks.json). Opens the app if installed, else Play Store.
app.use(shareLinkRoutes);

// Root Route
app.get('/', (req, res) => {
  res.status(200).json(
    new ApiResponse(200, {
      project: 'SHARE2GO API',
      status: 'active',
      version: '1.0.0',
      docs: '/api/v1/health',
    }, 'Welcome to SHARE2GO API')
  );
});

// Mount Central API Routes
app.use('/api/v1', routes);

// 404 Route Handler
app.use((req, res, next) => {
  next(new ApiError(404, `Resource not found: ${req.method} ${req.originalUrl}`));
});

// Centralized Error Handling Middleware
app.use(errorHandler);

export default app;
