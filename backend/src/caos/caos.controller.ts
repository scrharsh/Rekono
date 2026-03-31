import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  Request,
  UseGuards,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CaosService } from './caos.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Connection, ConnectionDocument } from '../schemas/connection.schema';

@ApiTags('ca-os')
@ApiBearerAuth()
@Controller('ca-os')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CaosController {
  constructor(
    private readonly caosService: CaosService,
    @InjectModel(Connection.name) private connectionModel: Model<ConnectionDocument>,
  ) {}

  private async getConnectedShowrooms(caUserId: string): Promise<any[]> {
    const connections = await this.connectionModel
      .find({ caUserId, status: 'active' })
      .populate('showroomId', 'name gstin address phone')
      .sort({ connectedAt: -1 });

    return connections.map((c: any) => ({
      connectionId: c._id,
      showroom: c.showroomId,
      connectedAt: c.connectedAt,
    }));
  }

  @Get('tasks')
  @Roles('ca', 'admin')
  async getTasks(@Request() req: any, @Query('showroomId') showroomId?: string) {
    try {
      const connectedAll = await this.getConnectedShowrooms(req.user.userId);
      const connected = showroomId
        ? connectedAll.filter((c: any) => {
            const id = c.showroom?._id?.toString?.() ?? c.showroom?.id ?? c.showroom?._id;
            return String(id) === String(showroomId);
          })
        : connectedAll;

      const tasksPerShowroom = await Promise.all(
        connected.map(async (c: any) => {
          const id = c.showroom?._id?.toString?.() ?? c.showroom?.id ?? c.showroom?._id;
          if (!id) return [];
          return this.caosService.generateTasks(id);
        }),
      );

      const tasks = tasksPerShowroom.flat();
      return { tasks };
    } catch (error: any) {
      throw new HttpException({ error: 'Failed to fetch tasks' }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('tasks/:taskId/complete')
  @Roles('ca', 'admin')
  async completeTask(@Param('taskId') taskId: string, @Body() body: { notes?: string }) {
    try {
      return { message: 'Task marked as complete', taskId, notes: body.notes };
    } catch (error: any) {
      throw new HttpException(
        { error: 'Failed to complete task' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('alerts')
  @Roles('ca', 'admin')
  async getAlerts(
    @Request() req: any,
    @Query('showroomId') showroomId?: string,
    @Query('urgency') urgency?: string,
  ) {
    try {
      const connectedAll = await this.getConnectedShowrooms(req.user.userId);
      const connected = showroomId
        ? connectedAll.filter((c: any) => {
            const id = c.showroom?._id?.toString?.() ?? c.showroom?.id ?? c.showroom?._id;
            return String(id) === String(showroomId);
          })
        : connectedAll;

      const alertsPerShowroom = await Promise.all(
        connected.map(async (c: any) => {
          const showroom = c.showroom;
          const id = showroom?._id?.toString?.() ?? showroom?.id ?? showroom?._id;
          if (!id) return [];

          const alerts = await this.caosService.generateAlerts(id);
          return alerts.map((a: any) => ({
            ...a,
            showroomName: showroom?.name ?? showroom?.showroomName ?? undefined,
          }));
        }),
      );

      const alerts = alertsPerShowroom.flat();
      const normalizedUrgency = (urgency ?? '').toLowerCase().trim();
      const filtered =
        normalizedUrgency && ['critical', 'high', 'medium'].includes(normalizedUrgency)
          ? alerts.filter((a: any) => String(a.severity).toLowerCase() === normalizedUrgency)
          : alerts;

      return { alerts: filtered };
    } catch (error: any) {
      throw new HttpException(
        { error: 'Failed to fetch alerts' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('alerts/:alertId/acknowledge')
  @Roles('ca', 'admin')
  async acknowledgeAlert(@Param('alertId') alertId: string, @Body() body: { notes?: string }) {
    try {
      return { message: 'Alert acknowledged', alertId, notes: body.notes };
    } catch (error: any) {
      throw new HttpException(
        { error: 'Failed to acknowledge alert' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('health-score/:showroomId')
  async getHealthScore(@Param('showroomId') showroomId: string) {
    try {
      const result = await this.caosService.calculateHealthScore(showroomId);
      return result;
    } catch (error: any) {
      throw new HttpException(
        { error: 'Failed to calculate health score' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('home')
  @Roles('ca', 'admin')
  async getHome(@Request() req: any) {
    const connected = await this.getConnectedShowrooms(req.user.userId);

    const results = await Promise.all(
      connected.map(async (c: any) => {
        const showroom = c.showroom;
        const showroomId =
          showroom?._id?.toString?.() ?? showroom?.id ?? showroom?._id ?? String(showroom);
        if (!showroomId) return null;

        const [health, tasks, alerts] = await Promise.all([
          this.caosService.calculateHealthScore(showroomId),
          this.caosService.generateTasks(showroomId),
          this.caosService.generateAlerts(showroomId),
        ]);

        const alertsWithName = (alerts ?? []).map((a: any) => ({
          ...a,
          showroomName: showroom?.name,
        }));

        return {
          showroomId,
          showroom,
          health,
          tasks: tasks ?? [],
          alerts: alertsWithName,
        };
      }),
    );

    const perClient = results.filter(Boolean) as any[];
    const allTasks = perClient.flatMap((x) => x.tasks);
    const allAlerts = perClient.flatMap((x) => x.alerts);

    const tasksByUrgency = {
      high: allTasks.filter((t: any) => t.priority === 'high'),
      medium: allTasks.filter((t: any) => t.priority === 'medium'),
      low: allTasks.filter((t: any) => t.priority !== 'high' && t.priority !== 'medium'),
    };

    const alertsBySeverity = {
      critical: allAlerts.filter((a: any) => a.severity === 'critical'),
      high: allAlerts.filter((a: any) => a.severity === 'high'),
      medium: allAlerts.filter((a: any) => a.severity === 'medium'),
    };

    // Build “What should I do next?” recommendations (rules-based scoring)
    const scoredActions: Array<{
      id: string;
      kind: 'task' | 'alert';
      label: string;
      reason: string;
      showroomId: string;
      score: number;
      priority?: string;
      severity?: string;
      dueDate?: Date;
    }> = [];

    for (const t of allTasks) {
      const priorityScore = t.priority === 'high' ? 30 : t.priority === 'medium' ? 20 : 10;
      scoredActions.push({
        id: t.id,
        kind: 'task',
        label: t.title,
        reason: t.description,
        showroomId: t.showroomId ?? t.showroom_id ?? t.showroom,
        score: priorityScore,
        priority: t.priority,
        dueDate: t.dueDate ? new Date(t.dueDate) : undefined,
      });
    }

    for (const a of allAlerts) {
      const sevScore = a.severity === 'critical' ? 40 : a.severity === 'high' ? 30 : 20;
      scoredActions.push({
        id: a.id,
        kind: 'alert',
        label: a.title,
        reason: a.description,
        showroomId: a.showroomId,
        score: sevScore,
        severity: a.severity,
      });
    }

    const recommendations = scoredActions
      .sort((x, y) => {
        if (y.score !== x.score) return y.score - x.score;
        const xd = x.dueDate ? x.dueDate.getTime() : 0;
        const yd = y.dueDate ? y.dueDate.getTime() : 0;
        return xd - yd;
      })
      .slice(0, 5)
      .map((x) => ({
        id: x.id,
        kind: x.kind,
        label: x.label,
        reason: x.reason,
        showroomId: x.showroomId,
        priority: x.priority,
        severity: x.severity,
      }));

    const urgentClients = perClient.filter(
      (x: any) => x.tasks.some((t: any) => t.priority === 'high') || x.alerts.some((a: any) => a.severity !== 'medium'),
    ).length;

    return {
      today: {
        urgentClients,
        totalClients: perClient.length,
        tasksByUrgency,
        alertsBySeverity,
        recommendations,
        perClient: perClient.map((x: any) => ({
          showroomId: x.showroomId,
          showroomName: x.showroom?.name,
          gstin: x.showroom?.gstin,
          healthScore: x.health?.score ?? 0,
          pendingTasks: x.tasks.length,
          pendingAlerts: x.alerts.length,
        })),
      },
    };
  }
}
