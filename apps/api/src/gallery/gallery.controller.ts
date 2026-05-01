import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type AuthUser } from '../common/current-user.decorator';
import { PrismaService } from '../common/prisma.service';
import { ImagePipeline } from '../uploads/image.pipeline';

@UseGuards(JwtAuthGuard)
@Controller('gallery')
export class GalleryController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly imagePipeline: ImagePipeline,
  ) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.prisma.galleryItem.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post()
  @UseInterceptors(FileInterceptor('image', { limits: { fileSize: 8 * 1024 * 1024 } }))
  async create(
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: Express.Multer.File,
    @Body('caption') caption?: string,
  ) {
    const processed = await this.imagePipeline.processBuffer(file.buffer);
    return this.prisma.galleryItem.create({
      data: {
        tenantId: user.tenantId,
        storageKey: processed.storageKey,
        caption,
        isPublic: true,
      },
    });
  }

  @Delete(':id')
  async remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.prisma.galleryItem.deleteMany({
      where: { id, tenantId: user.tenantId },
    });
    return { ok: true };
  }
}
