import { Injectable } from '@nestjs/common';
import sharp from 'sharp';

import { StorageService } from './storage.service';

export interface ProcessedImage {
  storageKey: string;
  publicPath: string;
  mime: string;
  width: number;
  height: number;
  size: number;
}

@Injectable()
export class ImagePipeline {
  constructor(private readonly storage: StorageService) {}

  async processBuffer(buffer: Buffer): Promise<ProcessedImage> {
    const pipeline = sharp(buffer, { failOn: 'error' }).rotate();
    const meta = await pipeline.metadata();
    const optimized = await pipeline
      .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    const file = await this.storage.save(optimized, 'webp', 'requests');
    return {
      storageKey: file.storageKey,
      publicPath: file.publicPath,
      mime: 'image/webp',
      width: meta.width ?? 0,
      height: meta.height ?? 0,
      size: file.size,
    };
  }
}
