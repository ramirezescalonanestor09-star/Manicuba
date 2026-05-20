import { Controller, Get, NotFoundException, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { existsSync, createReadStream } from 'fs';
import { extname } from 'path';

import { StorageService } from './storage.service';

const MIME_BY_EXT: Record<string, string> = {
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
};

@Controller('files')
export class FilesController {
  constructor(private readonly storage: StorageService) {}

  @Get(':path(*)')
  async serve(@Req() req: Request, @Res() res: Response) {
    const storageKey = (req.params as Record<string, string>).path;
    if (!storageKey) throw new NotFoundException();
    const result = await this.storage.readStream(storageKey);
    if (!result) throw new NotFoundException();
    const mime =
      MIME_BY_EXT[extname(storageKey).toLowerCase()] ?? 'application/octet-stream';
    res.setHeader('Content-Type', mime);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    if ('path' in result) {
      if (!existsSync(result.path)) throw new NotFoundException();
      createReadStream(result.path).pipe(res);
      return;
    }
    res.end(result.buffer);
  }
}
