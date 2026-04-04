import { NotFoundException } from '@nestjs/common';
import { BusinessMode } from '../schemas/business-profile.schema';
import { BusinessProfilesService } from './business-profiles.service';

describe('BusinessProfilesService', () => {
  const mockProfileModel = {
    findOne: jest.fn(),
    create: jest.fn(),
  };

  const mockUserModel = {
    findById: jest.fn(),
  };

  const mockShowroomModel = {
    create: jest.fn(),
    updateOne: jest.fn(),
  };

  let service: BusinessProfilesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new BusinessProfilesService(
      mockProfileModel as any,
      mockUserModel as any,
      mockShowroomModel as any,
    );
  });

  it('returns profile for getMyProfile', async () => {
    const profile = { _id: '507f1f77bcf86cd799439012' };
    mockProfileModel.findOne.mockResolvedValue(profile);

    const result = await service.getMyProfile('507f1f77bcf86cd799439011');
    expect(result).toBe(profile);
  });

  it('throws when profile not found', async () => {
    mockProfileModel.findOne.mockResolvedValue(null);

    await expect(service.getMyProfile('507f1f77bcf86cd799439011')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('creates profile when none exists', async () => {
    mockProfileModel.findOne.mockResolvedValue(null);
    const ownerSave = jest.fn().mockResolvedValue(undefined);
    const owner = {
      phone: '9876543210',
      email: 'owner@rekono.in',
      showroomIds: [],
      save: ownerSave,
    };
    mockUserModel.findById.mockResolvedValue(owner);
    mockShowroomModel.create.mockResolvedValue({ _id: '507f1f77bcf86cd799439013' });
    mockProfileModel.create.mockResolvedValue({ _id: 'new-profile' });

    const result = await service.upsertMyProfile('507f1f77bcf86cd799439011', {
      name: 'Acme Traders',
      businessMode: BusinessMode.RETAIL,
    });

    expect(mockProfileModel.create).toHaveBeenCalledTimes(1);
    expect(mockShowroomModel.create).toHaveBeenCalledTimes(1);
    expect(owner.showroomIds[0]).toEqual('507f1f77bcf86cd799439013');
    expect(ownerSave).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ _id: 'new-profile' });
  });

  it('updates existing profile when found', async () => {
    const save = jest.fn().mockResolvedValue({ _id: 'existing-profile' });
    const existing = {
      name: 'Old Name',
      businessMode: BusinessMode.WHOLESALE,
      phone: '9999999999',
      email: 'old@rekono.in',
      businessCategories: [],
      save,
    };
    mockProfileModel.findOne.mockResolvedValue(existing);
    mockUserModel.findById.mockResolvedValue({ showroomIds: ['507f1f77bcf86cd799439013'] });
    mockShowroomModel.updateOne.mockResolvedValue({});

    const result = await service.upsertMyProfile('507f1f77bcf86cd799439011', {
      name: 'New Name',
      businessMode: BusinessMode.SERVICES,
      phone: '9876543210',
    });

    expect(existing.name).toBe('New Name');
    expect(existing.businessMode).toBe(BusinessMode.SERVICES);
    expect(save).toHaveBeenCalledTimes(1);
    expect(mockShowroomModel.updateOne).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ _id: 'existing-profile' });
  });
});
