import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    const { method, originalUrl } = req;
    const source =
      req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    res.on('finish', () => {
      const duration = Date.now() - start;
      const status = res.statusCode;
      const bytes = res.getHeader('content-length') || 0;
      console.log(
        `[${new Date().toISOString()}] ${method} ${originalUrl} - ${status} - ${bytes} bytes - ${duration}ms - source: ${source}`,
      );
    });

    next();
  }
}
