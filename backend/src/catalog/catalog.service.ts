import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CatalogItem, CatalogItemDocument } from '../schemas/catalog-item.schema';

@Injectable()
export class CatalogService {
  constructor(@InjectModel(CatalogItem.name) private catalogModel: Model<CatalogItemDocument>) {}

  async create(businessId: string, dto: any): Promise<CatalogItemDocument> {
    return this.catalogModel.create({
      ...dto,
      businessId: new Types.ObjectId(businessId),
    });
  }

  async update(businessId: string, itemId: string, dto: any): Promise<CatalogItemDocument> {
    const item = await this.catalogModel.findOneAndUpdate(
      { _id: new Types.ObjectId(itemId), businessId: new Types.ObjectId(businessId) },
      {
        $set: {
          ...dto,
          businessId: new Types.ObjectId(businessId),
        },
      },
      { new: true },
    );

    if (!item) throw new NotFoundException('Catalog item not found');
    return item;
  }

  async findAll(
    businessId: string,
    filters?: { category?: string; search?: string; favoritesOnly?: boolean },
  ): Promise<CatalogItemDocument[]> {
    const query: Record<string, any> = {
      businessId: new Types.ObjectId(businessId),
      isActive: true,
    };
    if (filters?.category) query.category = filters.category;
    if (filters?.favoritesOnly) query.isFavorite = true;
    if (filters?.search) {
      query.$or = [
        { category: { $regex: filters.search, $options: 'i' } },
        { type: { $regex: filters.search, $options: 'i' } },
        { name: { $regex: filters.search, $options: 'i' } },
        { 'attributes.brand': { $regex: filters.search, $options: 'i' } },
      ];
    }
    return this.catalogModel.find(query).sort({ usageCount: -1, lastUsedAt: -1 });
  }

  async getTopItems(businessId: string, limit = 10): Promise<CatalogItemDocument[]> {
    return this.catalogModel
      .find({ businessId: new Types.ObjectId(businessId), isActive: true })
      .sort({ usageCount: -1 })
      .limit(limit);
  }

  async getRecentItems(businessId: string, limit = 10): Promise<CatalogItemDocument[]> {
    return this.catalogModel
      .find({
        businessId: new Types.ObjectId(businessId),
        isActive: true,
        lastUsedAt: { $exists: true },
      })
      .sort({ lastUsedAt: -1 })
      .limit(limit);
  }

  async recordUsage(itemId: string): Promise<void> {
    await this.catalogModel.updateOne(
      { _id: new Types.ObjectId(itemId) },
      { $inc: { usageCount: 1 }, $set: { lastUsedAt: new Date() } },
    );
  }

  async autoCreateFromTransaction(
    businessId: string,
    category: string,
    amount: number,
    type?: string,
  ): Promise<CatalogItemDocument> {
    const existing = await this.catalogModel.findOne({
      businessId: new Types.ObjectId(businessId),
      category,
      type: type || { $exists: false },
      sellingPrice: amount,
    });

    if (existing) {
      await this.recordUsage(existing._id.toString());
      return existing;
    }

    return this.catalogModel.create({
      businessId: new Types.ObjectId(businessId),
      category,
      type,
      sellingPrice: amount,
      isAutoCreated: true,
      usageCount: 1,
      lastUsedAt: new Date(),
    });
  }

  async getSuggestions(businessId: string, amount: number): Promise<CatalogItemDocument[]> {
    const tolerance = amount * 0.1;
    return this.catalogModel
      .find({
        businessId: new Types.ObjectId(businessId),
        isActive: true,
        sellingPrice: { $gte: amount - tolerance, $lte: amount + tolerance },
      })
      .sort({ usageCount: -1 })
      .limit(5);
  }

  async toggleFavorite(businessId: string, itemId: string): Promise<CatalogItemDocument> {
    const item = await this.catalogModel.findOne({
      _id: new Types.ObjectId(itemId),
      businessId: new Types.ObjectId(businessId),
    });
    if (!item) throw new NotFoundException('Catalog item not found');
    item.isFavorite = !item.isFavorite;
    return item.save();
  }

  async getCategories(businessId: string): Promise<string[]> {
    const result = await this.catalogModel.distinct('category', {
      businessId: new Types.ObjectId(businessId),
      isActive: true,
    });
    return result;
  }

  async delete(businessId: string, itemId: string): Promise<void> {
    await this.catalogModel.updateOne(
      { _id: new Types.ObjectId(itemId), businessId: new Types.ObjectId(businessId) },
      { $set: { isActive: false } },
    );
  }
}
