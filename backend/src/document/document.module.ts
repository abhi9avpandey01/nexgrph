import { Module } from '@nestjs/common';
import { DocumentService } from './document.service';
import { DocumentController } from './document.controller';
import { SupabaseService } from '../supabase.service';
import { ProcessingModule } from '../processing/processing.module';

@Module({
  imports: [ProcessingModule],
  providers: [DocumentService, SupabaseService],
  controllers: [DocumentController],
})
export class DocumentModule {}