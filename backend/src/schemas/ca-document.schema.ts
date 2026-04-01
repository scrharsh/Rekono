import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CaDocumentDocument = HydratedDocument<CaDocument>;

export enum DocumentType {
  PAN = 'pan',
  AADHAAR = 'aadhaar',
  GST_CERTIFICATE = 'gst_certificate',
  BANK_DETAILS = 'bank_details',
  ADDRESS_PROOF = 'address_proof',
  INCORPORATION_CERT = 'incorporation_cert',
  PARTNERSHIP_DEED = 'partnership_deed',
  BOARD_RESOLUTION = 'board_resolution',
  MOA_AOA = 'moa_aoa',
  AGREEMENT = 'agreement',
  INVOICE = 'invoice',
  RETURN_FILING = 'return_filing',
  FINANCIAL_STATEMENT = 'financial_statement',
  OTHER = 'other',
}

@Schema({ timestamps: true })
export class CaDocument {
  @Prop({ type: Types.ObjectId, ref: 'CaClient', required: true })
  clientId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  caUserId: Types.ObjectId;

  @Prop({ required: true, enum: Object.values(DocumentType) })
  documentType: string;

  @Prop({ required: true })
  fileName: string;

  @Prop({ required: true })
  originalName: string;

  @Prop({ required: true })
  filePath: string;

  @Prop()
  mimeType?: string;

  @Prop({ min: 0 })
  fileSize?: number;

  @Prop({ default: 'uploaded', enum: ['uploaded', 'verified', 'rejected', 'expired'] })
  status: string;

  @Prop()
  verifiedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  verifiedBy?: Types.ObjectId;

  @Prop()
  expiryDate?: Date;

  @Prop()
  notes?: string;

  @Prop({ type: Map, of: String })
  metadata?: Map<string, string>;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const CaDocumentSchema = SchemaFactory.createForClass(CaDocument);

CaDocumentSchema.index({ clientId: 1, documentType: 1 });
CaDocumentSchema.index({ caUserId: 1, clientId: 1 });
CaDocumentSchema.index({ clientId: 1, status: 1 });
CaDocumentSchema.index({ expiryDate: 1 }, { sparse: true });
