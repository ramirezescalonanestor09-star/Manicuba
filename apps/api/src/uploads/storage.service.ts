import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import * as path from 'path';
import { randomBytes } from 'crypto';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

export interface StoredFile {
  storageKey: string;
  publicPath: string;
  size: number;
}

interface StorageDriver {
  save(buffer: Buffer, ext: string, prefix: string): Promise<StoredFile>;
  resolveLocal(storageKey: string): Promise<{ path: string } | null>;
  fetchBuffer(storageKey: string): Promise<Buffer | null>;
}

class LocalDriver implements StorageDriver {
  constructor(private readonly baseDir: string) {}

  async save(buffer: Buffer, ext: string, prefix: string): Promise<StoredFile> {
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

  async resolveLocal(storageKey: string) {
    const safe = storageKey.replace(/\.\./g, '');
    return { path: path.join(this.baseDir, safe) };
  }

  async fetchBuffer(): Promise<Buffer | null> {
    return null;
  }
}

class S3Driver implements StorageDriver {
  private client: S3Client;
  constructor(
    private readonly bucket: string,
    private readonly publicBase: string | undefined,
    region: string,
    endpoint: string | undefined,
    accessKey: string,
    secretKey: string,
  ) {
    this.client = new S3Client({
      region,
      endpoint: endpoint || undefined,
      forcePathStyle: !!endpoint,
      credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
    });
  }

  async save(buffer: Buffer, ext: string, prefix: string): Promise<StoredFile> {
    const id = randomBytes(12).toString('hex');
    const dateDir = new Date().toISOString().slice(0, 10);
    const key = `${prefix}/${dateDir}/${id}.${ext.replace(/^\./, '')}`;
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: ext === 'webp' ? 'image/webp' : 'application/octet-stream',
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );
    return {
      storageKey: key,
      publicPath: this.publicBase ? `${this.publicBase}/${key}` : `/files/${key}`,
      size: buffer.byteLength,
    };
  }

  async resolveLocal(): Promise<null> {
    return null;
  }

  async fetchBuffer(storageKey: string): Promise<Buffer | null> {
    const res = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: storageKey }),
    );
    const stream = res.Body as NodeJS.ReadableStream | undefined;
    if (!stream) return null;
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk as Buffer);
    }
    return Buffer.concat(chunks);
  }
}

@Injectable()
export class StorageService implements OnModuleInit {
  private driver!: StorageDriver;
  private baseDir: string;

  constructor(private readonly config: ConfigService) {
    this.baseDir = path.resolve(this.config.get<string>('STORAGE_LOCAL_DIR') ?? './storage');
  }

  async onModuleInit() {
    const driverName = (this.config.get<string>('STORAGE_DRIVER') ?? 'local').toLowerCase();
    if (driverName === 's3') {
      this.driver = new S3Driver(
        this.config.get<string>('S3_BUCKET') ?? '',
        this.config.get<string>('S3_PUBLIC_BASE_URL') || undefined,
        this.config.get<string>('S3_REGION') ?? 'auto',
        this.config.get<string>('S3_ENDPOINT') || undefined,
        this.config.get<string>('S3_ACCESS_KEY') ?? '',
        this.config.get<string>('S3_SECRET_KEY') ?? '',
      );
    } else {
      await fs.mkdir(this.baseDir, { recursive: true });
      this.driver = new LocalDriver(this.baseDir);
    }
  }

  save(buffer: Buffer, ext: string, prefix = 'img'): Promise<StoredFile> {
    return this.driver.save(buffer, ext, prefix);
  }

  async readStream(storageKey: string): Promise<{ path: string } | { buffer: Buffer } | null> {
    const local = await this.driver.resolveLocal(storageKey);
    if (local) return local;
    const buffer = await this.driver.fetchBuffer(storageKey);
    return buffer ? { buffer } : null;
  }
}
