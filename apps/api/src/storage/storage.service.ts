import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Storage } from '@google-cloud/storage';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

export interface ProcessedFile {
  originalName: string;
  fileName: string;
  publicUrl: string;
  fileType: 'image' | 'text';
  size: number;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly storage: Storage;
  private readonly bucketName: string;

  constructor(private readonly configService: ConfigService) {
    // Initialize Google Cloud Storage
    const projectId = this.configService.get<string>('GCS_PROJECT_ID')!;
    const keyFilename = this.configService.get<string>('GCS_KEY_FILE')!;

    this.storage = new Storage({ projectId, keyFilename });

    this.bucketName = this.configService.get<string>('GCS_BUCKET_NAME')!;
  }

  /**
   * Process and upload files to Google Cloud Storage
   */
  async uploadFiles(files: Express.Multer.File[]): Promise<ProcessedFile[]> {
    const uploadPromises = files.map((file) => this.processAndUploadFile(file));
    return Promise.all(uploadPromises);
  }

  /**
   * Process a single file and upload to GCS
   */
  private async processAndUploadFile(
    file: Express.Multer.File,
  ): Promise<ProcessedFile> {
    const fileType = this.getFileType(file);
    const fileName = this.generateFileName(file.originalname, fileType);

    let processedBuffer: Buffer;
    let processedSize: number;

    if (fileType === 'image') {
      // Process image with Sharp
      const processed = await this.processImage(file.buffer);
      processedBuffer = processed.buffer;
      processedSize = processed.size;
    } else {
      // Validate text file size (100KB limit)
      if (file.size > 100 * 1024) {
        throw new Error(`Text file "${file.originalname}" exceeds 100KB limit`);
      }
      processedBuffer = file.buffer;
      processedSize = file.size;
    }

    // Upload to Google Cloud Storage
    const publicUrl = await this.uploadToGCS(
      fileName,
      processedBuffer,
      file.mimetype,
    );

    return {
      originalName: file.originalname,
      fileName,
      publicUrl,
      fileType,
      size: processedSize,
    };
  }

  /**
   * Determine file type based on MIME type
   */
  private getFileType(file: Express.Multer.File): 'image' | 'text' {
    if (file.mimetype.startsWith('image/')) {
      // Validate image types
      const allowedImageTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
      ];
      if (!allowedImageTypes.includes(file.mimetype)) {
        throw new Error(`Unsupported image type: ${file.mimetype}`);
      }
      return 'image';
    }

    if (file.mimetype === 'text/plain') {
      return 'text';
    }

    throw new Error(`Unsupported file type: ${file.mimetype}`);
  }

  /**
   * Process image using Sharp - resize to max 320x240
   */
  private async processImage(
    buffer: Buffer,
  ): Promise<{ buffer: Buffer; size: number }> {
    try {
      const processedBuffer = await sharp(buffer)
        .resize(320, 240, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: 85 }) // Convert to JPEG for consistency and smaller size
        .toBuffer();

      return {
        buffer: processedBuffer,
        size: processedBuffer.length,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to process image: ${errorMessage}`);
      throw new Error('Failed to process image');
    }
  }

  /**
   * Upload file to Google Cloud Storage
   */
  private async uploadToGCS(
    fileName: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<string> {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(fileName);

      const stream = file.createWriteStream({
        metadata: {
          contentType: mimeType,
          cacheControl: 'public, max-age=31536000', // 1 year cache
        },
      });

      return new Promise((resolve, reject) => {
        stream.on('error', (error) => {
          this.logger.error(`Failed to upload file ${fileName}: ${error}`);
          reject(new Error('Failed to upload file'));
        });
        stream.on('finish', () => {
          resolve(file.publicUrl());
        });
        stream.end(buffer);
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to upload file ${fileName}: ${errorMessage}`);
      throw new Error('Failed to upload file');
    }
  }

  /**
   * Generate unique filename
   */
  private generateFileName(
    originalName: string,
    fileType: 'image' | 'text',
  ): string {
    const timestamp = Date.now();
    const uuid = uuidv4().substring(0, 8);
    const extension = fileType === 'image' ? 'jpg' : 'txt';
    const cleanName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');

    return `${fileType}s/${timestamp}-${uuid}-${cleanName.substring(0, 50)}.${extension}`;
  }
}
