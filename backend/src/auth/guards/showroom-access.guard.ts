import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

/**
 * ShowroomAccessGuard enforces showroom-scoped access control.
 *
 * Apply this guard to routes that include a :showroomId param.
 * It checks the authenticated user's role and showroomIds to determine access:
 *
 * - admin:      full access to all showrooms
 * - ca:         access to all showrooms in their showroomIds array
 * - accountant: access to showrooms in their showroomIds array
 * - staff:      access only to their single assigned showroom (showroomIds[0])
 *
 * Requirements: 23.5, 23.6, 23.7, 23.8
 */
@Injectable()
export class ShowroomAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('No user found in request');
    }

    // Admins have full access to everything
    if (user.role === 'admin') {
      return true;
    }

    const showroomId = request.params?.showroomId;

    // If no showroomId param, allow through (non-showroom-scoped route)
    if (!showroomId) {
      return true;
    }

    const userShowroomIds: string[] = (user.showroomIds ?? []).map((id: any) => id.toString());

    switch (user.role) {
      case 'staff':
        // Staff can only access their single assigned showroom
        return this.checkStaffAccess(showroomId, userShowroomIds);

      case 'accountant':
        // Accountant can access any showroom in their assigned list
        return this.checkAssignedAccess(showroomId, userShowroomIds);

      case 'ca':
        // CA can access all assigned showrooms (+ CA features handled by @Roles decorator)
        return this.checkAssignedAccess(showroomId, userShowroomIds);

      default:
        throw new ForbiddenException(`Unknown role: ${user.role}`);
    }
  }

  private checkStaffAccess(showroomId: string, userShowroomIds: string[]): boolean {
    if (userShowroomIds.length === 0) {
      throw new ForbiddenException('Staff user has no assigned showroom');
    }

    const assignedShowroom = userShowroomIds[0];
    if (assignedShowroom !== showroomId) {
      throw new ForbiddenException('Staff can only access their own assigned showroom');
    }

    return true;
  }

  private checkAssignedAccess(showroomId: string, userShowroomIds: string[]): boolean {
    if (!userShowroomIds.includes(showroomId)) {
      throw new ForbiddenException('Access denied: showroom not in your assigned list');
    }

    return true;
  }
}
