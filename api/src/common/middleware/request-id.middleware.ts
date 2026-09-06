import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const existingId = req.headers['x-request-id'] as string;
    const requestId = existingId || randomUUID();

    req.headers['x-request-id'] = requestId;
    res.setHeader('X-Request-Id', requestId);

    next();
  }
}
