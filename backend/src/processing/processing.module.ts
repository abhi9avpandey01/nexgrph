import { Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { DocumentProcessor } from './document.processor';
import { GraphService } from './graph.service';

@Module({
  providers: [QueueService, DocumentProcessor, GraphService],
  exports: [QueueService],
})
export class ProcessingModule {}