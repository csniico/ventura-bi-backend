export interface ICreateAppointment {
  userId: string;
  businessId: string;
  customerId?: string;
  title: string;
  startTime: string;
  endTime: string;
  description?: string;
  notes?: string;
  isRecurring: boolean;
  recurringFrequency?: string;
  recurringUntil?: string;
}
