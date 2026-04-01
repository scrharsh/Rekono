import { BusinessMode } from '../schemas/business-profile.schema';
import { BusinessProfilesController } from './business-profiles.controller';

describe('BusinessProfilesController', () => {
  const mockService = {
    getBusinessModes: jest.fn(),
    getMyProfile: jest.fn(),
    toClientProfile: jest.fn(),
    toClientContext: jest.fn(),
    upsertMyProfile: jest.fn(),
  };

  let controller: BusinessProfilesController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new BusinessProfilesController(mockService as any);
  });

  it('returns supported business modes', () => {
    mockService.getBusinessModes.mockReturnValue([BusinessMode.RETAIL, BusinessMode.SERVICES]);

    const result = controller.getModes();

    expect(result).toEqual({ modes: [BusinessMode.RETAIL, BusinessMode.SERVICES] });
  });

  it('returns mapped client profile for getMyProfile', async () => {
    const req = { user: { userId: '507f1f77bcf86cd799439011' } };
    const profile = { _id: 'profile-1' };
    const mapped = { _id: 'profile-1', showroomId: 'showroom-1' };

    mockService.getMyProfile.mockResolvedValue(profile);
    mockService.toClientProfile.mockReturnValue(mapped);

    const result = await controller.getMyProfile(req);

    expect(mockService.getMyProfile).toHaveBeenCalledWith(req.user.userId);
    expect(mockService.toClientProfile).toHaveBeenCalledWith(profile);
    expect(result).toEqual(mapped);
  });

  it('returns mapped business context', async () => {
    const req = { user: { userId: '507f1f77bcf86cd799439011' } };
    const profile = { _id: 'profile-1' };
    const context = {
      businessProfileId: 'profile-1',
      showroomId: 'showroom-1',
      businessMode: 'retail',
      businessName: 'Acme',
    };

    mockService.getMyProfile.mockResolvedValue(profile);
    mockService.toClientContext.mockReturnValue(context);

    const result = await controller.getMyContext(req);

    expect(mockService.getMyProfile).toHaveBeenCalledWith(req.user.userId);
    expect(mockService.toClientContext).toHaveBeenCalledWith(profile);
    expect(result).toEqual(context);
  });

  it('upserts and returns mapped client profile', async () => {
    const req = { user: { userId: '507f1f77bcf86cd799439011' } };
    const dto = { name: 'Acme', businessMode: BusinessMode.RETAIL };
    const profile = { _id: 'profile-1' };
    const mapped = { _id: 'profile-1', showroomId: 'showroom-1' };

    mockService.upsertMyProfile.mockResolvedValue(profile);
    mockService.toClientProfile.mockReturnValue(mapped);

    const result = await controller.upsertMyProfile(req, dto as any);

    expect(mockService.upsertMyProfile).toHaveBeenCalledWith(req.user.userId, dto);
    expect(mockService.toClientProfile).toHaveBeenCalledWith(profile);
    expect(result).toEqual(mapped);
  });
});
