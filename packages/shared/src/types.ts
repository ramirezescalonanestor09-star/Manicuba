export type Currency = 'CUP' | 'MLC' | 'USD';

export const CURRENCIES: Currency[] = ['CUP', 'MLC', 'USD'];

export type RequestStatus =
  | 'NEW'
  | 'REVIEWING'
  | 'QUOTED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'EXPIRED';

export type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export type UserRole = 'OWNER' | 'STAFF';

export type NotificationChannel =
  | 'EMAIL'
  | 'SMS'
  | 'WHATSAPP'
  | 'TELEGRAM'
  | 'INAPP';

export type MessageSenderType = 'CLIENT' | 'MANICURI' | 'SYSTEM';

export interface Money {
  amount: number;
  currency: Currency;
}
