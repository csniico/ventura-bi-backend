import { BadRequestException } from '@nestjs/common';

export class FileValidator {
  private static readonly IMAGE_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
  ];

  private static readonly WORD_TYPES = [
    'application/msword', //doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', //docx
  ];

  private static readonly VIDEO_TYPES = [
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime',
    'video/x-msvideo', // avi
    'video/x-matroska', // mkv
  ];

  private static readonly AUDIO_TYPES = [
    'audio/mpeg', // mp3
    'audio/wav',
    'audio/ogg',
    'audio/mp4',
    'audio/aac',
    'audio/webm',
  ];

  static validateImage(mimeType: string) {
    if (!this.IMAGE_TYPES.includes(mimeType))
      throw new BadRequestException(`Invalid image type: ${mimeType}`);
  }

  static validateWord(mimeType: string) {
    if (!this.WORD_TYPES.includes(mimeType))
      throw new BadRequestException(`Invalid Word Document type: ${mimeType}`);
  }

  static validateVideo(mimeType: string) {
    if (!this.VIDEO_TYPES.includes(mimeType))
      throw new BadRequestException(`Invalid video type: ${mimeType}`);
  }

  static validateAudio(mimeType: string) {
    if (!this.AUDIO_TYPES.includes(mimeType))
      throw new BadRequestException(`Invalid audio type: ${mimeType}`);
  }

  static isImage(mimeType: string) {
    return this.IMAGE_TYPES.includes(mimeType);
  }

  static isWordDocument(mimeType: string) {
    return this.WORD_TYPES.includes(mimeType);
  }

  static isVideo(mimeType: string) {
    return this.VIDEO_TYPES.includes(mimeType);
  }

  static isAudio(mimeType: string) {
    return this.AUDIO_TYPES.includes(mimeType);
  }
}
