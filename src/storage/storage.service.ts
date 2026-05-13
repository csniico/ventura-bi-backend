import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { nanoid } from 'nanoid';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private storageClient: S3Client;
  private readonly bucketName: string;
  private readonly region: string;

  constructor(private readonly configService: ConfigService) {
    this.bucketName = this.configService.get<string>('S3_BUCKET_NAME', '');
    this.region = this.configService.get<string>('AWS_REGION', '');

    if (!this.bucketName || !this.region) {
      throw new Error('Missing AWS S3 configuration');
    }

    this.storageClient = new S3Client({ region: this.region });
  }

  async uploadImageToBucket(buffer: Buffer, key: string, mimeType: string) {
    const uid = nanoid(12);
    const finalKey = `${key}${uid}.${mimeType.split('/')[1]}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: finalKey,
      Body: buffer,
      ContentType: mimeType,
    });

    await this.storageClient.send(command);

    return {
      imageUrl: `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${finalKey}`,
      fileKey: finalKey,
    };
  }

  async deleteFromBucket(fileKey: string) {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: fileKey,
    });

    await this.storageClient.send(command);

    return {
      message: 'File deleted successfully',
      fileKey,
    };
  }
}
