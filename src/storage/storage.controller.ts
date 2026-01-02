import {
  BadRequestException,
  Controller,
  HttpCode,
  HttpStatus,
  ImATeapotException,
  Logger,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { FileInterceptor } from '@nestjs/platform-express';
import path from 'path';
import { FileValidator } from 'src/storage/validators/file-validator';
import fs from 'fs';
import { StorageService } from 'src/storage/storage.service';

const MAX_IMAGE_SIZE_B: number = 1024 * 1024 * 10;
const TEMP_DEST = path.resolve('/tmp');

@Controller('assets')
export class StorageController {
  private readonly logger = new Logger(StorageController.name);

  constructor(
    @InjectQueue('assets') private readonly assetsQueue: Queue,
    private readonly storageService: StorageService,
  ) {}

  private _validateUploadedFile(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    const { filename, mimetype, path: filePath } = file;

    if (!filename || !mimetype || !filePath) {
      throw new BadRequestException('Missing required file properties');
    }
  }
  private _fileToBuffer(filePath: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const stream = fs.createReadStream(filePath);

      stream.on('data', (chunk) =>
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)),
      );
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  }

  /**
   * uploadImage - api endpoint for handling incoming requests for image upload
   * @param file - the image file included in the request payload
   */
  @HttpCode(HttpStatus.OK)
  @Post('/images')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_IMAGE_SIZE_B },
      dest: TEMP_DEST,
    }),
  )
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    try {
      this.logger.log('Incoming file upload request');
      this.logger.debug(
        `File payload: ${JSON.stringify({
          filename: file?.filename,
          originalname: file?.originalname,
          mimetype: file?.mimetype,
          size: file?.size,
          path: file?.path,
        })}`,
      );

      this._validateUploadedFile(file);
      const { mimetype, path: filePath } = file;
      FileValidator.validateImage(mimetype);

      const buffer = await this._fileToBuffer(path.resolve(filePath));

      return await this.storageService.uploadImageToBucket(
        buffer,
        'images/',
        mimetype,
      );
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw new BadRequestException(error.message);
      }
      throw new ImATeapotException('cannot upload image');
    }
  }
}
