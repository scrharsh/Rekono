import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Connection, ConnectionDocument } from '../schemas/connection.schema';
import { CaosService } from '../caos/caos.service';
import { CaTasksService } from '../ca-tasks/ca-tasks.service';

@Injectable()
export class AlertService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AlertService.name);
  private periodicTimer?: NodeJS.Timeout;
  private morningTimer?: NodeJS.Timeout;

  constructor(
    @InjectModel(Connection.name) private connectionModel: Model<ConnectionDocument>,
    private readonly caosService: CaosService,
    private readonly caTasksService: CaTasksService,
  ) {}

  onModuleInit(): void {
    this.periodicTimer = setInterval(() => {
      this.runPeriodicAutomation().catch(() => {
        this.logger.warn('Periodic automation tick failed');
      });
    }, 30 * 60 * 1000);

    this.scheduleMorningSweep();
  }

  onModuleDestroy(): void {
    if (this.periodicTimer) clearInterval(this.periodicTimer);
    if (this.morningTimer) clearTimeout(this.morningTimer);
  }

  private scheduleMorningSweep(): void {
    const now = new Date();
    const nextRun = new Date(now);
    nextRun.setHours(8, 0, 0, 0);
    if (nextRun <= now) nextRun.setDate(nextRun.getDate() + 1);

    const delayMs = nextRun.getTime() - now.getTime();
    this.morningTimer = setTimeout(async () => {
      await this.runMorningSweep();
      this.scheduleMorningSweep();
    }, delayMs);
  }

  private async ensureSystemTasksForShowroom(caUserId: string, showroomId: string): Promise<void> {
    const generatedTasks = await this.caosService.generateTasks(showroomId);
    await Promise.all(
      generatedTasks.map((task: any) =>
        this.caTasksService.createSystemTask(caUserId, {
          type: task.type,
          priority: task.priority,
          title: task.title,
          description: task.description,
          dueDate: task.dueDate,
          actionData: {
            showroomId: String(showroomId),
            generatedBy: 'phase-3-scheduler',
          },
        }),
      ),
    );

    const activeTypes = [...new Set(generatedTasks.map((task: any) => String(task.type)))];
    await this.caTasksService.reconcileSystemTasks(caUserId, showroomId, activeTypes);
  }

  private async evaluateConnection(connection: ConnectionDocument): Promise<{ alerts: number; tasks: number }> {
    const showroomId = connection.showroomId?.toString();
    const caUserId = connection.caUserId?.toString();
    if (!showroomId || !caUserId) return { alerts: 0, tasks: 0 };

    const [alerts, tasks] = await Promise.all([
      this.caosService.generateAlerts(showroomId),
      this.caosService.generateTasks(showroomId),
    ]);

    await this.ensureSystemTasksForShowroom(caUserId, showroomId);
    return { alerts: alerts.length, tasks: tasks.length };
  }

  async runPeriodicAutomation(): Promise<void> {
    const activeConnections = await this.connectionModel.find({ status: 'active' });
    for (const connection of activeConnections) {
      try {
        await this.evaluateConnection(connection);
      } catch (error) {
        const showroomId = connection.showroomId?.toString?.() ?? 'unknown';
        this.logger.warn(`Failed periodic evaluation for showroom ${showroomId}`);
      }
    }
  }

  async runMorningSweep(): Promise<void> {
    await this.runPeriodicAutomation();
  }

  async triggerForCA(caUserId: string): Promise<{ evaluated: number; alertsGenerated: number; tasksGenerated: number }> {
    const activeConnections = await this.connectionModel.find({
      status: 'active',
      caUserId,
    });

    let alertsGenerated = 0;
    let tasksGenerated = 0;
    for (const connection of activeConnections) {
      const result = await this.evaluateConnection(connection);
      alertsGenerated += result.alerts;
      tasksGenerated += result.tasks;
    }

    return {
      evaluated: activeConnections.length,
      alertsGenerated,
      tasksGenerated,
    };
  }
}
