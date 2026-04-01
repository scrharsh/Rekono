import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CaDocument, CaDocumentDocument, DocumentType } from '../schemas/ca-document.schema';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CaDocumentsService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads', 'documents');

  constructor(
    @InjectModel(CaDocument.name) private documentModel: Model<CaDocumentDocument>,
  ) {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async upload(caUserId: string, clientId: string, file: Express.Multer.File, documentType: string, notes?: string): Promise<CaDocumentDocument> {
    const fileName = `${uuidv4()}-${file.originalname}`;
    const filePath = path.join(this.uploadDir, fileName);
    fs.writeFileSync(filePath, file.buffer);

    return this.documentModel.create({
      caUserId: new Types.ObjectId(caUserId),
      clientId: new Types.ObjectId(clientId),
      documentType,
      fileName,
      originalName: file.originalname,
      filePath,
      mimeType: file.mimetype,
      fileSize: file.size,
      notes,
    });
  }

  async findAll(caUserId: string, clientId?: string): Promise<CaDocumentDocument[]> {
    const query: Record<string, any> = { caUserId: new Types.ObjectId(caUserId) };
    if (clientId) query.clientId = new Types.ObjectId(clientId);
    return this.documentModel.find(query).populate('clientId', 'name phone').sort({ createdAt: -1 });
  }

  async getCompleteness(caUserId: string, clientId: string): Promise<any> {
    const required = Object.values(DocumentType).filter(t => ['pan', 'aadhaar', 'gst_certificate', 'bank_details'].includes(t));
    const documents = await this.documentModel.find({
      caUserId: new Types.ObjectId(caUserId),
      clientId: new Types.ObjectId(clientId),
    });

    const uploaded = documents.map(d => d.documentType);
    const missing = required.filter(r => !uploaded.includes(r));
    const completeness = Math.round(((required.length - missing.length) / required.length) * 100);

    return {
      uploaded: documents.map(d => ({ type: d.documentType, name: d.originalName, status: d.status, uploadedAt: d.createdAt })),
      missing,
      completeness,
      totalRequired: required.length,
      totalUploaded: required.length - missing.length,
    };
  }

  async verify(caUserId: string, documentId: string): Promise<CaDocumentDocument> {
    const doc = await this.documentModel.findOneAndUpdate(
      { _id: new Types.ObjectId(documentId), caUserId: new Types.ObjectId(caUserId) },
      { $set: { status: 'verified', verifiedAt: new Date(), verifiedBy: new Types.ObjectId(caUserId) } },
      { new: true },
    );
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  async delete(caUserId: string, documentId: string): Promise<void> {
    const doc = await this.documentModel.findOne({
      _id: new Types.ObjectId(documentId),
      caUserId: new Types.ObjectId(caUserId),
    });
    if (!doc) throw new NotFoundException('Document not found');

    if (fs.existsSync(doc.filePath)) {
      fs.unlinkSync(doc.filePath);
    }
    await this.documentModel.deleteOne({ _id: doc._id });
  }
}
