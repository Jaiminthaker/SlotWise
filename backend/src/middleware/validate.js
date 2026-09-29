import { AppError } from '../utils/errors.js';

export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse({ body: req.body, query: req.query, params: req.params });
    if (!result.success) {
      return next(new AppError(422, 'VALIDATION_ERROR', result.error.issues[0]?.message ?? 'Invalid request'));
    }
    req.validated = result.data;
    return next();
  };
}