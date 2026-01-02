import { Request } from 'express';

export const accessTokenCookieExtractor = (req: Request): string | null => {
  if (req && req.cookies) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return req.cookies['access_token'] || null;
  }
  return null;
};

export const refreshTokenCookieExtractor = (req: Request): string | null => {
  if (req && req.cookies) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return req.cookies['refresh_token'] || null;
  }
  return null;
};
