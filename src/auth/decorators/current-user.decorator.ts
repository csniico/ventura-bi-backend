import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestWithUser } from '../../common/interfaces/request-with-user.interface';

/**
 * Decorator to inject current user into route handler
 * @example getCurrentUser(@CurrentUser() user: { id: string, email: string })
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user;
  },
);
