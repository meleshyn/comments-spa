import { applyDecorators, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { multerOptions } from '../constants/multer.constants';

/**
 * @param fieldName The name of the field in the multipart/form-data request that contains the files.
 * @param maxCount The maximum number of files allowed.
 */
export function ApiFiles(fieldName: string = 'files', maxCount: number = 5) {
  return applyDecorators(
    UseInterceptors(FilesInterceptor(fieldName, maxCount, multerOptions)),
  );
}
