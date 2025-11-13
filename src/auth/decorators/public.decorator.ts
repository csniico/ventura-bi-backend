import { SetMetadata } from '@nestjs/common';

export const PUBLIC_KEY = 'isPublic';

/**
 * Decorator to mark a route as public (bypass authentication)
 * @example @Public()
 */
export const Public = () => SetMetadata(PUBLIC_KEY, true);
