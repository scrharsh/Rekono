import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../../audit/audit.service';

type EntityType =
  | 'match'
  | 'sale_entry'
  | 'payment_record'
  | 'invoice'
  | 'catalog_item'
  | 'ca_client'
  | 'ca_service'
  | 'ca_payment'
  | 'ca_document'
  | 'ca_task'
  | 'business_profile';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);
  private readonly writeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const method = String(request.method || '').toUpperCase();

    if (!this.writeMethods.has(method)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap({
        next: async (response) => {
          try {
            const routePath = String(request.route?.path || request.url || '');
            const entityType = this.inferEntityType(routePath);
            if (!entityType) return;

            const action = this.inferAction(method, routePath);
            const entityId = this.inferEntityId(request, response);
            if (!entityId) return;

            await this.auditService.log({
              entityType,
              entityId,
              action,
              userId: request.user?.userId,
              actorType: request.user?.userId ? 'user' : 'system',
              metadata: {
                method,
                routePath,
                params: request.params,
                statusCode: context.switchToHttp().getResponse()?.statusCode,
                ipAddress: request.ip,
                userAgent: request.headers?.['user-agent'],
              },
            });
          } catch (error: any) {
            this.logger.warn(`Audit log skipped: ${error?.message || 'unknown error'}`);
          }
        },
      }),
    );
  }

  private inferAction(method: string, routePath: string): string {
    if (routePath.includes('/tasks') && routePath.includes('/assign') && method === 'POST')
      return 'assign';
    if (routePath.includes('/tasks') && routePath.includes('/bulk-assign') && method === 'POST')
      return 'bulk_assign';
    if (routePath.includes('/tasks') && routePath.includes('/reassign') && method === 'POST')
      return 'reassign';
    if (routePath.includes('/matches') && method === 'POST') return 'match';
    if (routePath.includes('/matches') && method === 'DELETE') return 'unmatch';
    if (routePath.includes('/status') && (method === 'PUT' || method === 'PATCH')) {
      return 'status_change';
    }
    if (method === 'POST') return 'create';
    if (method === 'DELETE') return 'delete';
    return 'update';
  }

  private inferEntityType(routePath: string): EntityType | null {
    const normalizedRoute = routePath.startsWith('/') ? routePath : `/${routePath}`;

    if (normalizedRoute.includes('/sales')) return 'sale_entry';
    if (normalizedRoute.includes('/payments')) return 'payment_record';
    if (normalizedRoute.includes('/matches')) return 'match';
    if (normalizedRoute.includes('/invoices')) return 'invoice';
    if (normalizedRoute.includes('/exports')) return 'invoice';
    if (normalizedRoute.includes('/catalog')) return 'catalog_item';
    if (normalizedRoute.includes('/ca/clients')) return 'ca_client';
    if (normalizedRoute.includes('/ca/services')) return 'ca_service';
    if (normalizedRoute.includes('/ca/payments')) return 'ca_payment';
    if (normalizedRoute.includes('/ca/documents')) return 'ca_document';
    if (normalizedRoute.includes('/ca/tasks')) return 'ca_task';
    if (normalizedRoute.includes('/business-profiles')) return 'business_profile';
    return null;
  }

  private inferEntityId(request: any, response: any): string | null {
    const paramCandidates = [
      request.params?.id,
      request.params?.saleId,
      request.params?.paymentId,
      request.params?.itemId,
      request.params?.clientId,
      request.params?.serviceId,
      request.params?.documentId,
      request.params?.taskId,
    ];

    for (const candidate of paramCandidates) {
      if (typeof candidate === 'string' && candidate.length >= 24) {
        return candidate;
      }
    }

    const responseCandidates = [
      response?._id,
      response?.id,
      response?.sale?._id,
      response?.payment?._id,
      response?.client?._id,
      response?.service?._id,
      response?.document?._id,
      response?.task?._id,
    ];

    for (const candidate of responseCandidates) {
      if (typeof candidate === 'string' && candidate.length >= 24) {
        return candidate;
      }
    }

    const bodyCandidates = [
      request.body?.saleId,
      request.body?.paymentId,
      request.body?.entityId,
      request.body?.clientId,
      request.body?.serviceId,
      request.body?.documentId,
      request.body?.taskId,
      request.body?._id,
    ];

    for (const candidate of bodyCandidates) {
      if (typeof candidate === 'string' && candidate.length >= 24) {
        return candidate;
      }
    }

    return null;
  }
}
