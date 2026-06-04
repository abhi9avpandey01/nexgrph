import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { SupabaseService } from '../supabase.service';
import { QueueService } from '../processing/queue.service';

@Injectable()
export class DocumentService {
  constructor(
    private prisma: PrismaService,
    private supabase: SupabaseService,
    private queueService: QueueService,
  ) {}

  async uploadDocument(userId: string, workspaceId: string, file: Express.Multer.File) {
    const member = await this.prisma.workspaceMember.findFirst({
      where: { userId, workspaceId },
    });
    if (!member) throw new ForbiddenException('Access denied');

    const filename = `${workspaceId}/${Date.now()}-${file.originalname}`;
    const { error } = await this.supabase.getClient().storage
      .from('documents')
      .upload(filename, file.buffer, { contentType: file.mimetype });

    if (error) throw new Error(error.message);

    const { data: urlData } = this.supabase.getClient().storage
      .from('documents')
      .getPublicUrl(filename);

    const document = await this.prisma.document.create({
      data: {
        workspaceId,
        uploadedBy: userId,
        filename: file.originalname,
        fileType: file.mimetype,
        storageUrl: urlData.publicUrl,
        status: 'pending',
      },
    });

    await this.prisma.processingJob.create({
      data: {
        documentId: document.id,
        jobType: 'process_document',
        status: 'pending',
      },
    });

    await this.queueService.addDocumentJob(document.id);

    return document;
  }

  async getDocuments(userId: string, workspaceId: string) {
    const member = await this.prisma.workspaceMember.findFirst({
      where: { userId, workspaceId },
    });
    if (!member) throw new ForbiddenException('Access denied');

    return this.prisma.document.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteDocument(userId: string, documentId: string) {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
    });
    if (!document) throw new ForbiddenException('Document not found');

    const member = await this.prisma.workspaceMember.findFirst({
      where: { userId, workspaceId: document.workspaceId },
    });
    if (!member) throw new ForbiddenException('Access denied');

    await this.prisma.processingJob.deleteMany({
      where: { documentId },
    });

    await this.prisma.documentChunk.deleteMany({
      where: { documentId },
    });

    await this.prisma.graphEdge.deleteMany({
      where: { sourceDocumentId: documentId },
    });

    await this.prisma.graphNode.deleteMany({
      where: { sourceDocumentId: documentId },
    });

    await this.prisma.document.delete({
      where: { id: documentId },
    });

    return { message: 'Document deleted' };
  }
}