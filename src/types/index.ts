import type { Timestamp } from 'firebase/firestore';

export interface Car {
  id: string;
  name: string;
  make?: string;
  model?: string;
  year?: number;
  initialOdometer: number;
  userId: string;
  createdAt: Timestamp;
}

export type FuelType = 'lpg' | 'petrol';

export interface FuelRecord {
  id: string;
  carId: string;
  userId: string;
  date: Timestamp;
  odometer: number;
  fuelType: FuelType;
  liters: number;
  priceLpg: number;
  pricePetrol: number;
  totalCost: number;
  notes?: string;
  createdAt: Timestamp;
}

export interface Reminder {
  id: string;
  carId: string;
  userId: string;
  name: string;
  type: 'km' | 'date';
  isActive: boolean;
  createdAt: Timestamp;
  // km-based
  intervalKm?: number;
  lastServiceKm?: number;
  alertBeforeKm?: number[];
  notifiedKmThresholds?: number[];
  // date-based
  dueDate?: Timestamp;
  alertBeforeDays?: number[];
  notifiedDayThresholds?: number[];
}
