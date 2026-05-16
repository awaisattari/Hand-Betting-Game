import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

/**
 * Resolves the tenant from the `x-tenant-id` header and stamps it on the
 * request. Multi-tenancy is intentionally lightweight — the leaderboard
 * scopes by `tenantId` so a single deployment can serve multiple game
 * lobbies without sharing scores.
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request & { tenantId?: string }, _res: Response, next: NextFunction): void {
    const headerValue = req.headers['x-tenant-id'];
    const raw = Array.isArray(headerValue) ? headerValue[0] : headerValue;
    req.tenantId = (raw ?? '').trim() || 'default';
    next();
  }
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      tenantId?: string;
    }
  }
}
