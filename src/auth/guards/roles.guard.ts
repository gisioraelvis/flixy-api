import { CanActivate, ExecutionContext, mixin, Type } from '@nestjs/common';
import RequestWithUser from '../requestWithUser.interface';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from './jwt-auth.guard';

/**
 * Guard that checks if the user has the correct role to access the route.
 * @param setRoles - The role that the user must have to access the route.
 * @returns Bool - true if the user has the correct role, false otherwise.
 * @throws UnauthorizedException if the user does not have the correct role.
 *
 * @see https://wanago.io/2021/11/15/api-nestjs-authorization-roles-claims/
 */

export const RolesGuard = (...setRoles: Role[]): Type<CanActivate> => {
  class RoleGuardMixin extends JwtAuthGuard {
    async canActivate(context: ExecutionContext) {
      await super.canActivate(context);

      const request = context.switchToHttp().getRequest<RequestWithUser>();
      const user = request.user;

      // Check if the user has the correct role.
      return user?.roles.some((role) => setRoles.includes(role));
    }
  }

  return mixin(RoleGuardMixin);
};
