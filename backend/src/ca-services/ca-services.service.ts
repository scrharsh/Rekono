import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CaService, CaServiceDocument } from '../schemas/ca-service.schema';

@Injectable()
export class CaServicesService {
  constructor(@InjectModel(CaService.name) private serviceModel: Model<CaServiceDocument>) {}

  async create(caUserId: string, dto: any): Promise<CaServiceDocument> {
    return this.serviceModel.create({
      ...dto,
      caUserId: new Types.ObjectId(caUserId),
      clientId: new Types.ObjectId(dto.clientId),
    });
  }

  async findAll(
    caUserId: string,
    filters?: { clientId?: string; status?: string; serviceType?: string },
  ): Promise<CaServiceDocument[]> {
    const query: Record<string, any> = { caUserId: new Types.ObjectId(caUserId) };
    if (filters?.clientId) query.clientId = new Types.ObjectId(filters.clientId);
    if (filters?.status) query.status = filters.status;
    if (filters?.serviceType) query.serviceType = filters.serviceType;
    return this.serviceModel.find(query).populate('clientId', 'name phone').sort({ createdAt: -1 });
  }

  async findById(caUserId: string, serviceId: string): Promise<CaServiceDocument> {
    const service = await this.serviceModel
      .findOne({
        _id: new Types.ObjectId(serviceId),
        caUserId: new Types.ObjectId(caUserId),
      })
      .populate('clientId', 'name phone');
    if (!service) throw new NotFoundException('Service not found');
    return service;
  }

  async update(caUserId: string, serviceId: string, dto: any): Promise<CaServiceDocument> {
    const service = await this.serviceModel.findOneAndUpdate(
      { _id: new Types.ObjectId(serviceId), caUserId: new Types.ObjectId(caUserId) },
      { $set: dto },
      { new: true },
    );
    if (!service) throw new NotFoundException('Service not found');
    return service;
  }

  async updatePeriodStatus(
    caUserId: string,
    serviceId: string,
    period: string,
    status: string,
    notes?: string,
  ): Promise<CaServiceDocument> {
    const service = await this.findById(caUserId, serviceId);
    const existingIdx = service.periodStatuses.findIndex((p) => p.period === period);

    if (existingIdx >= 0) {
      service.periodStatuses[existingIdx].status = status;
      if (notes) service.periodStatuses[existingIdx].notes = notes;
      if (status === 'completed') service.periodStatuses[existingIdx].completedAt = new Date();
    } else {
      service.periodStatuses.push({
        period,
        status,
        notes,
        completedAt: status === 'completed' ? new Date() : undefined,
      } as any);
    }

    return service.save();
  }

  async delete(caUserId: string, serviceId: string): Promise<void> {
    const result = await this.serviceModel.deleteOne({
      _id: new Types.ObjectId(serviceId),
      caUserId: new Types.ObjectId(caUserId),
    });
    if (result.deletedCount === 0) throw new NotFoundException('Service not found');
  }

  async getServicesSummary(caUserId: string): Promise<any> {
    const caObjId = new Types.ObjectId(caUserId);
    const [totalServices, activeServices, byType, monthlyRevenue] = await Promise.all([
      this.serviceModel.countDocuments({ caUserId: caObjId }),
      this.serviceModel.countDocuments({ caUserId: caObjId, status: 'active' }),
      this.serviceModel.aggregate([
        { $match: { caUserId: caObjId, status: 'active' } },
        { $group: { _id: '$serviceType', count: { $sum: 1 }, totalFees: { $sum: '$fees' } } },
        { $sort: { count: -1 } },
      ]),
      this.serviceModel.aggregate([
        { $match: { caUserId: caObjId, status: 'active', frequency: 'monthly' } },
        { $group: { _id: null, total: { $sum: '$fees' } } },
      ]),
    ]);

    return {
      totalServices,
      activeServices,
      byType,
      monthlyRevenue: monthlyRevenue.length > 0 ? monthlyRevenue[0].total : 0,
    };
  }

  async getPeriodInsights(caUserId: string): Promise<any> {
    const caObjId = new Types.ObjectId(caUserId);
    const services = await this.serviceModel
      .find({ caUserId: caObjId, status: 'active' })
      .populate('clientId', 'name phone');

    const insights: any = {
      totalPeriods: 0,
      completedPeriods: 0,
      pendingPeriods: 0,
      overduePeriods: 0,
      inProgressPeriods: 0,
      byStatus: { completed: [], pending: [], inProgress: [], overdue: [] },
      byClient: new Map<string, any>(),
    };

    services.forEach((service) => {
      const populatedClient = service.clientId as any;
      const clientName = populatedClient?.name || 'Unknown';
      const clientInfo = {
        clientId: service.clientId,
        clientName,
      };

      service.periodStatuses.forEach((period) => {
        insights.totalPeriods += 1;

        const entry = {
          period: period.period,
          serviceName: service.name,
          serviceType: service.serviceType,
          ...clientInfo,
          status: period.status,
          completedAt: period.completedAt,
          notes: period.notes,
        };

        switch (period.status) {
          case 'completed':
            insights.completedPeriods += 1;
            insights.byStatus.completed.push(entry);
            break;
          case 'pending':
            insights.pendingPeriods += 1;
            insights.byStatus.pending.push(entry);
            break;
          case 'in_progress':
            insights.inProgressPeriods += 1;
            insights.byStatus.inProgress.push(entry);
            break;
          case 'overdue':
            insights.overduePeriods += 1;
            insights.byStatus.overdue.push(entry);
            break;
        }

        const clientId = (service.clientId as any)._id?.toString() || service.clientId.toString();
        if (!insights.byClient.has(clientId)) {
          insights.byClient.set(clientId, {
            clientId,
            clientName,
            total: 0,
            completed: 0,
            pending: 0,
            overdue: 0,
          });
        }

        const clientEntry = insights.byClient.get(clientId);
        clientEntry.total += 1;
        if (period.status === 'completed') clientEntry.completed += 1;
        else if (period.status === 'pending') clientEntry.pending += 1;
        else if (period.status === 'overdue') clientEntry.overdue += 1;
      });
    });

    return {
      summary: {
        totalPeriods: insights.totalPeriods,
        completedPeriods: insights.completedPeriods,
        pendingPeriods: insights.pendingPeriods,
        overduePeriods: insights.overduePeriods,
        inProgressPeriods: insights.inProgressPeriods,
        completionRate:
          insights.totalPeriods > 0
            ? Math.round((insights.completedPeriods / insights.totalPeriods) * 100)
            : 0,
      },
      byStatus: insights.byStatus,
      byClient: Array.from(insights.byClient.values()).sort(
        (a: any, b: any) => b.overdue - a.overdue,
      ),
    };
  }
}
