import {CanActivate,ExecutionContext,ForbiddenException,Injectable,} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    const normalizedRole = this.normalizeRole(user);

    if (!normalizedRole || !requiredRoles.includes(normalizedRole)) {
      throw new ForbiddenException('Forbidden Condition');
    }

    return true;
  }

  private normalizeRole(user: any): Role | null {
    const rawRole = user?.role ? String(user.role).toUpperCase() : null;
    if (rawRole && (Object.values(Role) as string[]).includes(rawRole)) {
      return rawRole as Role;
    }

    const rawType = user?.type ? String(user.type).toLowerCase() : '';
    if (rawType === 'teacher') return Role.TEACHER;
    if (rawType === 'student') return Role.STUDENT;
    if (rawType === 'user') return null;

    return null;
  }
}
