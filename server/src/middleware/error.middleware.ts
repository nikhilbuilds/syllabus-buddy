import { Request, Response, NextFunction } from "express";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const status = (err as any).status || 500;
  const message = err.message || "Internal server error";

  res.status(status).json({
    success: false,
    message,
  });
};
