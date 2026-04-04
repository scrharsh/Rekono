import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CatalogItemDocument = HydratedDocument<CatalogItem>;

class ItemAttributes {
  @Prop()
  brand?: string;

  @Prop()
  model?: string;

  @Prop()
  series?: string;

  @Prop()
  hsnCode?: string;

  @Prop()
  unit?: string;

  @Prop()
  serialNumber?: string;

  @Prop({ type: Map, of: String })
  custom?: Map<string, string>;
}

@Schema({ timestamps: true })
export class CatalogItem {
  @Prop({ type: Types.ObjectId, ref: 'BusinessProfile', required: true })
  businessId: Types.ObjectId;

  @Prop({ required: true })
  category: string;

  @Prop()
  type?: string;

  @Prop()
  name?: string;

  @Prop({ type: ItemAttributes, default: () => ({}) })
  attributes: ItemAttributes;

  @Prop({ min: 0 })
  gstRate?: number;

  @Prop({ min: 0 })
  basePrice?: number;

  @Prop({ min: 0 })
  sellingPrice?: number;

  @Prop({ default: 0 })
  usageCount: number;

  @Prop()
  lastUsedAt?: Date;

  @Prop({ default: false })
  isAutoCreated: boolean;

  @Prop({ default: false })
  isFavorite: boolean;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const CatalogItemSchema = SchemaFactory.createForClass(CatalogItem);

CatalogItemSchema.index({ businessId: 1, category: 1 });
CatalogItemSchema.index({ businessId: 1, usageCount: -1 });
CatalogItemSchema.index({ businessId: 1, isFavorite: 1 });
CatalogItemSchema.index({ businessId: 1, lastUsedAt: -1 });
CatalogItemSchema.index(
  { businessId: 1, category: 1, 'attributes.brand': 1, 'attributes.model': 1 },
  { sparse: true },
);
