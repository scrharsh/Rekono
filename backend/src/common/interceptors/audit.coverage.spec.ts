import { AuditService } from '../../audit/audit.service';
import { AuditInterceptor } from './audit.interceptor';

describe('AuditInterceptor route coverage', () => {
  const interceptor = new AuditInterceptor({ log: jest.fn() } as unknown as AuditService);
  const inferEntityType = (route: string) => (interceptor as any).inferEntityType(route);
  const inferAction = (method: string, route: string) => (interceptor as any).inferAction(method, route);

  it('maps all mutating domain routes to a supported audit entity type', () => {
    const routes = [
      '/showrooms/:showroomId/sales',
      '/showrooms/:showroomId/sales/:saleId',
      '/showrooms/:showroomId/payments',
      '/showrooms/:showroomId/payments/:paymentId',
      '/showrooms/:showroomId/matches',
      '/showrooms/:showroomId/matches/:matchId',
      '/showrooms/:showroomId/invoices',
      '/showrooms/:showroomId/exports/tally',
      '/catalog/:businessId',
      '/catalog/:businessId/:itemId',
      '/ca/clients',
      '/ca/clients/:id',
      '/ca/services',
      '/ca/services/:id',
      '/ca/payments',
      '/ca/payments/:id',
      '/ca/documents',
      '/ca/documents/:id',
      '/ca/tasks',
      '/ca/tasks/:id',
      '/ca/tasks/:id/status',
      '/business-profiles/me',
    ];

    for (const route of routes) {
      const entityType = inferEntityType(route);
      if (!entityType) {
        throw new Error(`Unmapped mutating route: ${route}`);
      }
    }
  });

  it('maps route + method to expected audit actions', () => {
    expect(inferAction('POST', '/showrooms/:showroomId/sales')).toBe('create');
    expect(inferAction('PATCH', '/showrooms/:showroomId/sales/:saleId')).toBe('update');
    expect(inferAction('PUT', '/ca/tasks/:id/status')).toBe('status_change');
    expect(inferAction('DELETE', '/showrooms/:showroomId/sales/:saleId')).toBe('delete');
    expect(inferAction('POST', '/showrooms/:showroomId/matches')).toBe('match');
    expect(inferAction('DELETE', '/showrooms/:showroomId/matches/:matchId')).toBe('unmatch');
  });

  it('keeps auth/system endpoints out of domain audit mapping', () => {
    expect(inferEntityType('/auth/login')).toBeNull();
    expect(inferEntityType('/auth/refresh')).toBeNull();
    expect(inferEntityType('/dashboard/summary')).toBeNull();
  });
});
