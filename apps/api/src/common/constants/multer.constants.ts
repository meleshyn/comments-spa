import { HttpException, HttpStatus } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

/**
 * Configuration object for Multer file uploads.
 */
export const multerOptions: MulterOptions = {
  /**
   * Defines resource limits for the uploaded files.
   */
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
  },

  /**
   * A filter function to control which files are accepted.
   * @param req - The Express request object.
   * @param file - The file being uploaded.
   * @param callback - A callback to indicate if the file is accepted.
   */
  fileFilter: (
    req: Request,
    file: Express.Multer.File,
    callback: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    // A list of allowed MIME types for files.
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'text/plain',
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      // Accept the file if its MIME type is in the allowed list.
      callback(null, true);
    } else {
      // Reject the file with a specific error message.
      callback(
        new HttpException(
          `Unsupported file type: ${file.mimetype}`,
          HttpStatus.BAD_REQUEST,
        ),
        false,
      );
    }
  },
};
