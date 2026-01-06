export type ServiceQueueJobPayload = {
  mailId?: string;
  email?: string;
  firstName?: string;
  code?: string;
  status?: 'NEW' | 'EXISTING';
};

export type ControllerQueueJobPayload = {
  to?: string[];
  subject?: string;
  htmlBody?: string;
  mailId?: string;
};
