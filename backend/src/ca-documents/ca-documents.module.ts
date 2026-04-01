import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CaDocumentsController } from './ca-documents.controller';
import { CaDocumentsService } from './ca-documents.service';
import { CaDocument, CaDocumentSchema } from '../schemas/ca-document.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: CaDocument.name, schema: CaDocumentSchema }])],
  controllers: [CaDocumentsController],
  providers: [CaDocumentsService],
  exports: [CaDocumentsService],
})
export class CaDocumentsModule {}
