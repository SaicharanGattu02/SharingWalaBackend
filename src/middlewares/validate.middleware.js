import { ApiError } from '../utils/apiError.js';

export const validate = (schema) => (req, res, next) => {
  try {
    if (schema.body) {
      req.body = schema.body.parse(req.body);
    }
    if (schema.query) {
      const parsedQuery = schema.query.parse(req.query);
      Object.defineProperty(req, 'query', {
        value: parsedQuery,
        writable: true,
        configurable: true,
      });
    }
    if (schema.params) {
      const parsedParams = schema.params.parse(req.params);
      Object.defineProperty(req, 'params', {
        value: parsedParams,
        writable: true,
        configurable: true,
      });
    }
    next();
  } catch (error) {
    if (error.name === 'ZodError') {
      const issues = error.issues || error.errors || [];
      const formattedErrors = issues.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return next(new ApiError(400, 'Validation Error', formattedErrors));
    }
    next(error);
  }
};
