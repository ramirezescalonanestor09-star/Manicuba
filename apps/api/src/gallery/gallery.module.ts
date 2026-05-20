import { Module } from '@nestjs/common';
import { GalleryController } from './gallery.controller';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [UploadsModule],
  controllers: [GalleryController],
})
export class GalleryModule {}
