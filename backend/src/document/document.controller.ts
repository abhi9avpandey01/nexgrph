import { memoryStorage } from 'multer';
import {
  Controller, Post, Get, Delete,
  Param, Query, UseGuards, Request,
  UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DocumentService } from './document.service';

@UseGuards(JwtAuthGuard)
@Controller('api/documents')
export class DocumentController {
  constructor(private documentService: DocumentService) {}

  @Post('upload')
@UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
upload(
  @Request() req,
  @Query('workspaceId') workspaceId: string,
  @UploadedFile() file: Express.Multer.File,
) {
  return this.documentService.uploadDocument(req.user.userId, workspaceId, file);
}

  @Get()
  getAll(@Request() req, @Query('workspaceId') workspaceId: string) {
    return this.documentService.getDocuments(req.user.userId, workspaceId);
  }

  @Delete(':id')
  delete(@Request() req, @Param('id') id: string) {
    return this.documentService.deleteDocument(req.user.userId, id);
  }
}