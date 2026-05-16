import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Pulls the resolved tenantId off the request. Always returns a non-empty
 * string because TenantMiddleware defaults missing tenants to 'default'.
 */
export const Tenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const req = ctx.switchToHttp().getRequest();
    return req.tenantId ?? 'default';
  }
);
