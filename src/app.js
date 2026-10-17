import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { ApiError } from './utils/apiError.js';
import { ApiResponse } from './utils/apiResponse.js';

const app = express();

// Security Middlewares
app.use(helmet());
app.use(
  cors({
    origin: env.corsOrigin,
    credentials: true,
  })
);

// Logging Middleware
if (env.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// Request Parsers
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));

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
