export class AuthLoginEvent {
  userId: string;
  email: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  timestamp: Date;
}

export class AuthLogoutEvent {
  userId: string;
  email: string;
  timestamp: Date;
}

export class AuthPasswordChangeEvent {
  userId: string;
  email: string;
  timestamp: Date;
}

export class AuthPasswordResetEvent {
  userId: string;
  email: string;
  timestamp: Date;
}

export class AuthTokenRefreshEvent {
  userId: string;
  timestamp: Date;
}
