import { RequestHandler } from 'express';

export function asyncWrapHandler(handler: RequestHandler): RequestHandler {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (err) {
      next(err);
    }
  }
}
