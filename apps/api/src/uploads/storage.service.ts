import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import * as path from 'path';
import { randomBytes } from 'crypto';

export interface StoredFile {
  storageKey: string;
  publicPath: string;
  size: number;
}

@Injectable()
export class StorageService implements OnModuleInit {
  private baseDir: string;

  constructor(private readonly config: ConfigService) {
    this.baseDir = path.resolve(this.config.get<string>('STORAGE_LOCAL_DIR') ?? './storage');
  }

  async onModuleInit() {
    await fs.mkdir(this.baseDir, { recursive: true });
  }

  async save(buffer: Buffer, ext: string, prefix = 'img'): Promise<StoredFile> {
    const id = randomBytes(12).toString('hex');
    const dateDir = new Date().toISOString().slice(0, 10);
    const dir = path.join(this.baseDir, prefix, dateDir);
    await fs.mkdir(dir, { recursive: true });
    const filename = `${id}.${ext.replace(/^\./, '')}`;
    const fullPath = path.join(dir, filename);
    await fs.writeFile(fullPath, buffer);
    const storageKey = path.relative(this.baseDir, fullPath).replace(/\\/g, '/');
    return {
      storageKey,
      publicPath: `/files/${storageKey}`,
      size: buffer.byteLength,
    };
  }

  async readStream(storageKey: string): Promise<{ path: string }> {
    const safe = storageKey.replace(/\.\./g, '');
    return { path: path.join(this.baseDir, safe) };
  }
}
