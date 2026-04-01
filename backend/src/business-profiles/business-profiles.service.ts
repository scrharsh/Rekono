import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BusinessProfile, BusinessProfileDocument, BusinessMode } from '../schemas/business-profile.schema';
import { User, UserDocument } from '../schemas/user.schema';
import { UpsertBusinessProfileDto } from './dto/business-profile.dto';
import { Showroom, ShowroomDocument } from '../schemas/showroom.schema';

@Injectable()
export class BusinessProfilesService {
  constructor(
    @InjectModel(BusinessProfile.name) private profileModel: Model<BusinessProfileDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Showroom.name) private showroomModel: Model<ShowroomDocument>,
  ) {}

  async getMyProfile(ownerId: string): Promise<BusinessProfileDocument> {
    const profile = await this.profileModel.findOne({ ownerId: new Types.ObjectId(ownerId), isActive: true });
    if (!profile) {
      throw new NotFoundException('Business profile not found');
    }
    return profile;
  }

  toClientProfile(profile: BusinessProfileDocument): Record<string, any> {
    const doc = profile.toObject() as Record<string, any>;
    return {
      ...doc,
      showroomId: doc.legacyShowroomId ? String(doc.legacyShowroomId) : undefined,
    };
  }

  toClientContext(profile: BusinessProfileDocument): Record<string, any> {
    const mapped = this.toClientProfile(profile);
    return {
      businessProfileId: mapped._id ? String(mapped._id) : undefined,
      showroomId: mapped.showroomId,
      businessMode: mapped.businessMode,
      businessName: mapped.name,
    };
  }

  async upsertMyProfile(ownerId: string, dto: UpsertBusinessProfileDto): Promise<BusinessProfileDocument> {
    const ownerObjectId = new Types.ObjectId(ownerId);
    const existing = await this.profileModel.findOne({ ownerId: ownerObjectId, isActive: true });
    const owner = await this.userModel.findById(ownerObjectId);
    const showroomId = await this.ensureShowroom(owner, dto, existing);

    if (existing) {
      existing.name = dto.name;
      existing.businessMode = dto.businessMode;
      existing.phone = dto.phone || existing.phone;
      existing.email = dto.email || existing.email;
      existing.address = dto.address || existing.address;
      existing.city = dto.city || existing.city;
      existing.state = dto.state || existing.state;
      existing.pincode = dto.pincode || existing.pincode;
      existing.gstin = dto.gstin || existing.gstin;
      existing.businessCategories = dto.businessCategories || existing.businessCategories || [];
      if (showroomId) {
        existing.legacyShowroomId = showroomId;
      }
      return existing.save();
    }

    return this.profileModel.create({
      ownerId: ownerObjectId,
      name: dto.name,
      businessMode: dto.businessMode,
      phone: dto.phone || owner?.phone || '0000000000',
      email: dto.email || owner?.email,
      address: dto.address,
      city: dto.city,
      state: dto.state,
      pincode: dto.pincode,
      gstin: dto.gstin,
      businessCategories: dto.businessCategories || [],
      legacyShowroomId: showroomId,
    });
  }

  private async ensureShowroom(
    owner: UserDocument | null,
    dto: UpsertBusinessProfileDto,
    profile?: BusinessProfileDocument | null,
  ): Promise<Types.ObjectId | undefined> {
    const assignedShowroomId = owner?.showroomIds?.[0];
    if (assignedShowroomId) {
      await this.showroomModel.updateOne(
        { _id: assignedShowroomId },
        {
          $set: {
            name: dto.name,
            phone: dto.phone || owner?.phone || '0000000000',
            address: dto.address,
            ...(dto.gstin ? { gstin: dto.gstin } : {}),
          },
        },
      );
      return assignedShowroomId as Types.ObjectId;
    }

    if (profile?.legacyShowroomId) {
      return profile.legacyShowroomId;
    }

    const created = await this.showroomModel.create({
      name: dto.name,
      phone: dto.phone || owner?.phone || '0000000000',
      address: dto.address,
      ...(dto.gstin ? { gstin: dto.gstin } : {}),
    });

    if (owner) {
      owner.showroomIds = [created._id as Types.ObjectId];
      await owner.save();
    }

    return created._id as Types.ObjectId;
  }

  getBusinessModes() {
    return Object.values(BusinessMode);
  }
}
