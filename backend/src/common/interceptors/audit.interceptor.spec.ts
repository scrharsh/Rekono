import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';
import { AuditService } from '../../audit/audit.service';
import { AuditInterceptor } from './audit.interceptor';

describe('AuditInterceptor', () => {
  const createHttpContext = (overrides?: {
    method?: string;
    routePath?: string;
    params?: Record<string, any>;
    body?: Record<string, any>;
    userId?: string;
  }): ExecutionContext => {
    const req: any = {
      method: overrides?.method || 'POST',
      route: { path: overrides?.routePath || 'showrooms/:showroomId/sales' },
      url: '/v1/showrooms/abc/sales',
      params: overrides?.params || { showroomId: 'abc' },
      body: overrides?.body || {},
      user: overrides?.userId ? { userId: overrides.userId } : undefined,
      ip: '127.0.0.1',
      headers: { 'user-agent': 'jest' },
    };

    const res: any = { statusCode: 201 };

    return {
      getType: jest.fn().mockReturnValue('http'),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: () => req,
        getResponse: () => res,
      }),
    } as unknown as ExecutionContext;
  };

  it('logs write operations with inferred entity/action', (done) => {
    const log = jest.fn().mockResolvedValue(undefined);
    const auditService = { log } as unknown as AuditService;
    const interceptor = new AuditInterceptor(auditService);

    const context = createHttpContext({
      method: 'POST',
      routePath: 'showrooms/:showroomId/sales',
      userId: '507f1f77bcf86cd799439011',
    });

    const callHandler: CallHandler = {
      handle: () =>
        of({
          sale: { _id: '507f1f77bcf86cd799439012' },
        }),
    };

    interceptor.intercept(context, callHandler).subscribe({
      complete: () => {
        setImmediate(() => {
          expect(log).toHaveBeenCalledTimes(1);
          expect(log).toHaveBeenCalledWith(
            expect.objectContaining({
              entityType: 'sale_entry',
              action: 'create',
              entityId: '507f1f77bcf86cd799439012',
              userId: '507f1f77bcf86cd799439011',
            }),
          );
          done();
        });
      },
    });
  });

  it('skips non-write requests', (done) => {
    const log = jest.fn().mockResolvedValue(undefined);
    const auditService = { log } as unknown as AuditService;
    const interceptor = new AuditInterceptor(auditService);

    const context = createHttpContext({ method: 'GET', routePath: 'showrooms/:showroomId/sales' });
    const callHandler: CallHandler = { handle: () => of({ sales: [] }) };

    interceptor.intercept(context, callHandler).subscribe({
      complete: () => {
        expect(log).not.toHaveBeenCalled();
        done();
      },
    });
  });

  it('maps CA task mutation routes to ca_task entity type', (done) => {
    const log = jest.fn().mockResolvedValue(undefined);
    const auditService = { log } as unknown as AuditService;
    const interceptor = new AuditInterceptor(auditService);

    const context = createHttpContext({
      method: 'PUT',
      routePath: 'ca/tasks/:id/status',
      params: { id: '507f1f77bcf86cd799439014' },
      userId: '507f1f77bcf86cd799439011',
      body: { status: 'completed' },
    });
    const callHandler: CallHandler = { handle: () => of({ success: true }) };

    interceptor.intercept(context, callHandler).subscribe({
      complete: () => {
        setImmediate(() => {
          expect(log).toHaveBeenCalledTimes(1);
          expect(log).toHaveBeenCalledWith(
            expect.objectContaining({
              entityType: 'ca_task',
              action: 'status_change',
              entityId: '507f1f77bcf86cd799439014',
            }),
          );
          done();
        });
      },
    });
  });
});
