import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

@Injectable()
export class QueueService {
  public documentQueue: Queue;

  constructor() {
    this.documentQueue = new Queue('document-processing', {
      connection: {
        url: process.env.REDIS_URL as string,
      },
    });
  }

  async addDocumentJob(documentId: string) {
    await this.documentQueue.add(
      'process-document',
      { documentId },
      { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
    );
  }
}