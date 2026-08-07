import type { Request, Response, NextFunction } from "express";
// Wraps async route handlers to catch errors and forward to error middleware
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;