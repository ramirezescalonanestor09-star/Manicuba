import { Module } from '@nestjs/common';

import { StorageService } from './storage.service';
import { ImagePipeline } from './image.pipeline';
import { FilesController } from './files.controller';

@Module({
  controllers: [FilesController],
  providers: [StorageService, ImagePipeline],
  exports: [StorageService, ImagePipeline],
})
export class UploadsModule {}
