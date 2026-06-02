import { Injectable, Logger } from '@nestjs/common';
import { Worker, Job } from 'bullmq';
import axios from 'axios';
import { PrismaService } from '../prisma.service';
import { GraphService } from './graph.service';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFParser = require('pdf2json');

@Injectable()
export class DocumentProcessor {
  private readonly logger = new Logger(DocumentProcessor.name);
  private worker: Worker;

  constructor(
  private prisma: PrismaService,
  private graphService: GraphService,
) {
    this.worker = new Worker(
      'document-processing',
      async (job: Job) => {
        await this.processDocument(job.data.documentId);
      },
      {
        connection: {
          url: process.env.REDIS_URL as string,
        },
      },
    );
    this.worker.on('completed', (job) => {
      this.logger.log(`Job ${job.id} completed`);
    });
    this.worker.on('failed', (job, err) => {
      this.logger.error(`Job ${job?.id} failed: ${err.message}`);
    });
  }

  async processDocument(documentId: string) {
    this.logger.log(`Processing document ${documentId}`);
    await this.prisma.processingJob.updateMany({
      where: { documentId, status: 'pending' },
      data: { status: 'processing', startedAt: new Date() },
    });
    await this.prisma.document.update({
      where: { id: documentId },
      data: { status: 'processing' },
    });
    try {
      const document = await this.prisma.document.findUnique({
        where: { id: documentId },
      });
      if (!document) throw new Error('Document not found');
      const response = await axios.get(document.storageUrl, {
        responseType: 'arraybuffer',
      });
      const buffer = Buffer.from(response.data);
      const fullText = await new Promise<string>((resolve, reject) => {
        const pdfParser = new PDFParser(null, 1);
        pdfParser.on('pdfParser_dataError', (err: any) => reject(err.parserError));
        pdfParser.on('pdfParser_dataReady', () => {
          resolve(pdfParser.getRawTextContent());
        });
        pdfParser.parseBuffer(buffer);
      });
      const chunks = this.splitIntoChunks(fullText, 1000, 200);
      for (let i = 0; i < chunks.length; i++) {
        await this.prisma.documentChunk.create({
          data: {
            documentId,
            chunkIndex: i,
            content: chunks[i],
            pageNumber: null,
          },
        });
      }
       // Extract knowledge graph  ← ADD EVERYTHING BELOW HERE
      const document2 = await this.prisma.document.findUnique({
        where: { id: documentId },
      });
      await this.graphService.extractAndStoreGraph(
        documentId,
        document2!.workspaceId,
        chunks,
      );
      await this.prisma.document.update({
        where: { id: documentId },
        data: { status: 'processed' },
      });
      await this.prisma.processingJob.updateMany({
        where: { documentId, status: 'processing' },
        data: { status: 'completed', completedAt: new Date() },
      });
      this.logger.log(`Document ${documentId} processed: ${chunks.length} chunks`);
    } catch (error) {
      this.logger.error(`Error processing document ${documentId}: ${error.message}`);
      await this.prisma.document.update({
        where: { id: documentId },
        data: { status: 'failed' },
      });
      await this.prisma.processingJob.updateMany({
        where: { documentId, status: 'processing' },
        data: { status: 'failed', errorMessage: error.message },
      });
      throw error;
    }
  }

  private splitIntoChunks(text: string, chunkSize: number, overlap: number): string[] {
    const chunks: string[] = [];
    let start = 0;
    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      const chunk = text.slice(start, end).trim();
      if (chunk.length > 50) {
        chunks.push(chunk);
      }
      start += chunkSize - overlap;
    }
    return chunks;
  }
}
