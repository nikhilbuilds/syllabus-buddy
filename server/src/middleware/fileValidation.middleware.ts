import { Request, Response, NextFunction } from "express";

const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "text/plain",
  "image/jpeg",
  "image/png",
  "image/gif",
];

export const validateFileType = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const file = (req as any).file;

  if (!file) {
    const error = new Error("No file uploaded");
    (error as any).status = 400;
    return next(error);
  }

  if (!ALLOWED_FILE_TYPES.includes(file.mimetype)) {
    const error = new Error(
      "Invalid file type. Supported types: PDF, TXT, JPEG, PNG, GIF"
    );
    (error as any).status = 400;
    return next(error);
  }

  next();
};
