import { AppError } from '../utils/errors.js';

export function notFound(req, res, next) {
  next(new AppError(404, 'NOT_FOUND', 'Resource not found'));
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  const status = error.status ?? (error.name === 'ValidationError' ? 422 : 500);
  const code = error.code ?? (error.name === 'ValidationError' ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR');
  const message = status === 500 ? 'An unexpected error occurred' : error.message;
  if (status >= 500) console.error(error);
  return res.status(status).json({ error: { code, message } });
}